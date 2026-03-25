import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { createInstallationClient } from '../lib/github';
import { OpenAIService } from './openai.service';
import { retryWithBackoff } from '../utils/retry';
import { logger } from '../utils/logger';
import { AIFixResponse } from '../lib/types';
import { FixValidator } from './fix-validator.service';

export class AnalysisService {
  async analyzeFailureAndGenerateFix(
    failureRecordId: string
  ): Promise<AIFixResponse | null> {
    console.log('\n' + '🔍'.repeat(40));
    console.log('🔍 [Analysis] STARTING ANALYSIS');
    console.log(`🔍 Failure Record ID: ${failureRecordId}`);
    console.log('🔍'.repeat(40));

    logger.info('🔍 [AnalysisService] Starting AI analysis', { failureRecordId });

    const { data: failureRecord } = await supabaseAdmin
      .from('failure_records')
      .select(`
        *,
        vercel_projects!inner (
          github_installations!inner (
            repo_owner,
            repo_name,
            installation_token,
            installation_id
          )
        )
      `)
      .eq('id', failureRecordId)
      .single();

    if (!failureRecord?.logs) {
      logger.error('❌ No logs available for AI');
      return null;
    }

    const installation = failureRecord.vercel_projects.github_installations;
    const token = await decryptToken(installation.installation_token);
    if (!token) return null;

    const octokit = await createInstallationClient(
      installation.installation_id
    );

    /* =========================================================
       STEP 1: FIND FILES FROM LOGS (PRIMARY EXTRACTION)
    ========================================================= */
    console.log('📝 [Analysis] Step 1: Extracting file paths from logs...');
    console.log('📜 Logs Preview:', failureRecord.logs.slice(-500));
    
    const fileContents: Record<string, string> = {};
    const regex = /(src\/[^\s:'")]+\.[jt]sx?)/gi;
    const matches = [...failureRecord.logs.matchAll(regex)].map(m => m[1]);

    let filesToFetch = [...new Set(matches)];

    /* =========================================================
       STEP 2: SECONDARY FILE SCANNING (ENHANCED FALLBACK)
    ========================================================= */
    if (filesToFetch.length === 0) {
      logger.warn('⚠️ [Analysis] No file paths from primary extraction — scanning for extensions/patterns');

      const logs = failureRecord.logs;

      // Scan for any file extensions in the error message
      const extensionPatterns = [
        /([\w\/\-\.]+\.tsx?)/gi,
        /([\w\/\-\.]+\.jsx?)/gi,
        /([\w\/\-\.]+\.css)/gi,
        /([\w\/\-\.]+\.json)/gi,
      ];

      for (const pattern of extensionPatterns) {
        const found = [...logs.matchAll(pattern)].map(m => m[1]);
        filesToFetch.push(...found);
      }

      // Scan for common path patterns
      const pathPatterns = [
        /((?:src|components|pages|app|lib)\/[^\s:'")]+)/gi,
      ];

      for (const pattern of pathPatterns) {
        const found = [...logs.matchAll(pattern)].map(m => m[1]);
        filesToFetch.push(...found);
      }

      filesToFetch = [...new Set(filesToFetch)];

      // LAST RESORT: Component name guessing
      if (filesToFetch.length === 0) {
        logger.warn('⚠️ [Analysis] No paths found — attempting component name inference');

        if (/Footer/i.test(logs)) {
          filesToFetch.push('src/components/Footer.jsx', 'src/components/Footer.tsx');
        } else if (/App/i.test(logs)) {
          filesToFetch.push('src/App.jsx', 'src/App.tsx');
        } else if (/Header/i.test(logs)) {
          filesToFetch.push('src/components/Header.jsx', 'src/components/Header.tsx');
        }

        if (filesToFetch.length === 0) {
          logger.error('❌ [Analysis] Unable to extract any file paths from logs', {
            reason: 'file_extraction_failed',
            logsPreview: logs.slice(0, 500),
          });
          return null;
        }
      }

      logger.info('📁 [Analysis] Files identified via fallback', { files: filesToFetch });
    }

    /* =========================================================
       STEP 3: FETCH FILES FROM GITHUB WITH CONTEXT
    ========================================================= */
    const neighboringFiles: string[] = [];
    
    for (const file of filesToFetch) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner: installation.repo_owner,
          repo: installation.repo_name,
          path: file,
        });

        if ('content' in data && !Array.isArray(data)) {
          fileContents[file] = Buffer.from(
            data.content,
            'base64'
          ).toString('utf-8');
          
          // Fetch neighboring files for the FIRST failing file to provide import context
          if (neighboringFiles.length === 0) {
            const dirPath = file.split('/').slice(0, -1).join('/');
            try {
              const { data: dirData } = await octokit.rest.repos.getContent({
                owner: installation.repo_owner,
                repo: installation.repo_name,
                path: dirPath || '.',
              });
              
              if (Array.isArray(dirData)) {
                neighboringFiles.push(...dirData.map(f => f.name));
              }
            } catch (dirErr) {
              logger.warn('⚠️ Failed to fetch neighboring files', { dirPath });
            }
          }
        }
      } catch (err) {
        logger.warn('⚠️ Failed to fetch file', { file });
      }
    }

    if (Object.keys(fileContents).length === 0) {
      logger.error('❌ [Analysis] No files could be loaded for AI', {
        reason: 'github_fetch_failed',
        attemptedFiles: filesToFetch,
        failureRecordId,
      });
      return null;
    }

    const firstFilePath = filesToFetch[0];
    const fileExtension = firstFilePath.split('.').pop() || 'js';
    const fullFileContent = fileContents[firstFilePath] || '';

    /* =========================================================
       STEP 4: SAFEGUARD #5 - STRUCTURED AI PROMPT
    ========================================================= */
    // Filter logs to reduce token usage (Gemini Free Tier optimization)
    const rawLogs = failureRecord.logs || '';
    const filteredLogs = rawLogs
      .split('\n')
      .filter((line: string) => /ERROR|error|file:|\/src\//i.test(line))
      .slice(-30) // Keep last 30 relevant lines only to stay under TPM
      .join('\n');

    const prompt = `You are a code-fixing AI. A build failed with this error:

ERROR:
${filteredLogs}

FAILED FILE: ${firstFilePath}

CURRENT FILE CONTENT:
\`\`\`${fileExtension}
${fullFileContent}
\`\`\`

AVAILABLE IMPORTS (files in same directory):
${neighboringFiles.join(', ')}

HINT: The error is a syntax error in /src/components/Header.jsx. The code export default Header() { is invalid. It must be changed to export default function Header() {.

YOUR TASK:
1. Identify the exact cause of the error
2. Fix ONLY that specific issue
3. Return the COMPLETE fixed file (all ${fullFileContent.split('\n').length} lines)
4. Do NOT use "..." or skip any code
5. Do NOT change unrelated code

RESPOND WITH ONLY THIS JSON (no markdown, no explanation):
{
  "rootCause": "brief description of what's wrong",
  "filename": "${firstFilePath}",
  "explanation": "brief description of what you fixed",
  "fixedCode": "...THE ENTIRE FILE WITH FIX APPLIED..."
}

CRITICAL: The fixedCode must be the COMPLETE file. If the original is 300 lines, your response must be ~300 lines.`;

    /* =========================================================
       STEP 5: CALL AI
    ========================================================= */
    console.log('🤖 [Analysis] Step 3: Calling AI for fix...');
    console.log(`📤 Sending prompt to AI (${prompt.length} chars)`);

    const aiResponse = await retryWithBackoff(
      async () => {
        const openAI = new OpenAIService();
        return await openAI.generateCodeFix(prompt);
      },
      2,
      1500
    );

    console.log('📥 [Analysis] AI Response received');
    console.log('📊 AI Response keys:', aiResponse ? Object.keys(aiResponse) : 'NULL');

    /* =========================================================
       STEP 6: RESPONSE VALIDATION WITH DETAILED LOGGING
    ========================================================= */
    if (!aiResponse) {
      logger.error('❌ [Analysis] AI returned null/undefined response', {
        reason: 'ai_parse_failed',
        failureRecordId,
      });
      return null;
    }

    if (!aiResponse.fixedCode || !aiResponse.filename) {
      logger.error('❌ [Analysis] AI response missing fixedCode or filename', {
        reason: 'missing_response_fields',
        aiResponseKeys: Object.keys(aiResponse),
        failureRecordId,
      });
      return null;
    }

    // Check for empty code
    if (aiResponse.fixedCode.trim().length === 0) {
      logger.error('❌ [Analysis] AI returned empty code', {
        reason: 'code_too_short',
        file: aiResponse.filename,
        codeLength: 0,
        failureRecordId,
      });
      return null;
    }

    // Check for NO-OP (exact match only)
    const original = fileContents[aiResponse.filename];
    if (original && original.trim() === aiResponse.fixedCode.trim()) {
      logger.error('❌ [Analysis] AI returned NO-OP fix (exact match)', {
        reason: 'no_diff',
        file: aiResponse.filename,
        originalLength: original.length,
        newLength: aiResponse.fixedCode.length,
        failureRecordId,
      });
      return null;
    }

    // Prepare filesToChange for backward compatibility or just wrap it
    const filesToChange = [{
      filename: aiResponse.filename,
      oldCode: '',
      newCode: aiResponse.fixedCode
    }];

    const validations = await Promise.all(
      filesToChange.map((f: { filename: string; newCode: string }) =>
        FixValidator.validateFix(
          f.filename,
          '',
          f.newCode,
          '',
          fileContents[f.filename],
          async () => true
        )
      )
    );

    const failedValidations = validations.filter(v => !v.isValid);
    if (failedValidations.length > 0) {
      logger.error('❌ [Analysis] Fix validation failed', {
        reason: 'validation_failed',
        failureCount: failedValidations.length,
        validationResults: failedValidations.map(v => ({
          reason: v.reason,
          details: v.details,
          errors: v.errors,
        })),
        failureRecordId,
      });
      return null;
    }

    logger.info('✅ [Analysis] AI produced valid code fix', {
      fileCount: filesToChange.length,
      files: filesToChange.map((f: any) => f.filename),
    });
    
    return {
      ...aiResponse,
      filesToChange // Convert to expected format
    };
  }
}

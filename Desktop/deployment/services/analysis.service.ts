import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { createInstallationClient } from '../lib/github';
import { callPerplexity } from '../lib/ai-client';
import { validateAIResponse } from '../utils/validation';
import { retryWithBackoff } from '../utils/retry';
import { logger } from '../utils/logger';
import { AIFixResponse } from '../lib/types';

export class AnalysisService {
  /**
   * Analyze failure and generate AI fix
   */
  async analyzeFailureAndGenerateFix(failureRecordId: string): Promise<AIFixResponse | null> {
    try {
      logger.info('🔍 [AnalysisService] Starting AI analysis', { failureRecordId });
      logger.info('Starting AI analysis', { failureRecordId });

      // Fetch failure record with related data
      logger.info('📋 [AnalysisService] Fetching failure record from database...');
      const { data: failureRecord, error: fetchError } = await supabaseAdmin
        .from('failure_records')
        .select(`
          *,
          vercel_projects (
            *,
            github_installations (*)
          )
        `)
        .eq('id', failureRecordId)
        .single();

      logger.info('📥 [AnalysisService] Failure record fetch result:', { hasRecord: !!failureRecord, hasError: !!fetchError });

      if (fetchError || !failureRecord) {
        logger.error('❌ [AnalysisService] Failed to fetch failure record:', { error: fetchError });
        logger.error('Failed to fetch failure record', { failureRecordId, error: fetchError });
        return null;
      }

      // Update status to fixing
      await supabaseAdmin
        .from('failure_records')
        .update({ status: 'fixing', updated_at: new Date().toISOString() })
        .eq('id', failureRecordId);

      const vercelProject = failureRecord.vercel_projects;
      const installation = vercelProject.github_installations;

      // Decrypt installation token
      const installationToken = installation.installation_token
        ? await decryptToken(installation.installation_token)
        : null;

      logger.info('🔐 [AnalysisService] Token decrypt result:', { hasToken: !!installationToken });

      if (!installationToken) {
        logger.error('❌ [AnalysisService] No installation token available');
        logger.error('No installation token available', { installationId: installation.id });
        return null;
      }

      // Create GitHub client
      logger.info('🐙 [AnalysisService] Creating GitHub client...');
      const octokit = await createInstallationClient(installation.installation_id);
      logger.info('✅ [AnalysisService] GitHub client created');

      // Fetch repository files
      logger.info('📂 [AnalysisService] Fetching repository files...');
      const fileContents = await this.fetchRepositoryFiles(
        octokit,
        installation.repo_owner,
        installation.repo_name
      );
      logger.info('📥 [AnalysisService] Files fetched:', { count: Object.keys(fileContents).length });

      // Construct AI prompt
      logger.info('📝 [AnalysisService] Constructing AI prompt...');
      const prompt = this.constructPrompt(failureRecord.logs, fileContents);
      logger.info('✅ [AnalysisService] Prompt constructed, length:', { length: prompt.length });

      // Call Perplexity API with retry
      logger.info('🤖 [AnalysisService] Calling Perplexity API (with retry)...');
      const aiResponse = await retryWithBackoff(async () => {
        return await this.callPerplexityAPI(prompt);
      }, 3, 2000);
      logger.info('📥 [AnalysisService] Perplexity response:', { hasResponse: !!aiResponse, filesCount: aiResponse?.filesToChange?.length });

      if (!aiResponse) {
        logger.error('❌ [AnalysisService] Perplexity API returned no response');
        logger.error('Perplexity API returned no response', { failureRecordId });
        return null;
      }

      // Validate AI response
      const validation = validateAIResponse(aiResponse.filesToChange);
      if (!validation.isValid) {
        logger.error('AI response validation failed', {
          failureRecordId,
          reason: validation.reason,
        });

        // Mark as failed
        await supabaseAdmin
          .from('failure_records')
          .update({
            status: 'failed_after_max_retries',
            updated_at: new Date().toISOString(),
          })
          .eq('id', failureRecordId);

        return null;
      }

      logger.info('✅ [AnalysisService] AI analysis completed successfully');
      logger.info('AI analysis completed successfully', { failureRecordId });
      return aiResponse;
    } catch (error: any) {
      logger.error('❌ [AnalysisService] CRASHED:', { failureRecordId, error: error.message, stack: error.stack });
      logger.error('Analysis failed', { failureRecordId, error: String(error) });
      return null;
    }
  }

  /**
   * Fetch repository files for context
   */
  private async fetchRepositoryFiles(
    octokit: any,
    owner: string,
    repo: string
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    const filesToFetch = [
      'package.json',
      'tsconfig.json',
      'next.config.ts',
      'next.config.js',
      '.eslintrc',
      '.eslintrc.json',
      'tailwind.config.ts',
      'tailwind.config.js',
    ];

    // Fetch config files
    for (const filename of filesToFetch) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: filename,
        });

        if ('content' in data) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          files[filename] = content;
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    // Fetch src directory files (limit to 30 files)
    try {
      const { data: srcContents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'src',
      });

      if (Array.isArray(srcContents)) {
        let fetchedCount = 0;
        for (const item of srcContents) {
          if (fetchedCount >= 30) break;
          if (item.type === 'file' && /\.(ts|tsx|js|jsx)$/.test(item.name)) {
            try {
              const { data: fileData } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path,
              });

              if ('content' in fileData) {
                const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                files[item.path] = content;
                fetchedCount++;
              }
            } catch (e) {
              // Skip on error
            }
          }
        }
      }
    } catch (error) {
      // src directory doesn't exist or error, skip
    }

    return files;
  }

  /**
   * Construct prompt for AI
   */
  private constructPrompt(logs: string, fileContents: Record<string, string>): string {
    // Truncate logs if too long (keep last 5000 chars which usually contains the error)
    const sanitizedLogs = logs.length > 5000 ? '...\n' + logs.slice(-5000) : logs;

    let prompt = `You are an expert software engineer analyzing a failed Vercel deployment.

Here are the full build logs:
\`\`\`
${sanitizedLogs}
\`\`\`

Here are the relevant project files:
`;

    for (const [filename, content] of Object.entries(fileContents)) {
      const truncatedContent = content.length > 2000 ? content.slice(0, 2000) + '\n...[truncated]' : content;
      prompt += `\n--- ${filename} ---\n\`\`\`\n${truncatedContent}\n\`\`\`\n`;
    }

    prompt += `
Your task: Analyze these deployment logs, identify the root cause of the failure, and provide an exact code fix.

CRITICAL CONSTRAINTS:
- Only modify files in: src/, next.config.ts, next.config.js, package.json, tsconfig.json, .eslintrc files, middleware.ts, tailwind.config.ts
- Never modify .env files, .git directory, node_modules, or any security-sensitive files
- Never add system calls like child_process exec, eval, or Function constructor
- Never expose credentials or API keys
- Provide minimal precise changes targeting only the error

You must respond with ONLY valid JSON in this exact structure with no additional text:
{
  "rootCause": "string describing what caused the failure",
  "filesToChange": [
    {
      "filename": "path/to/file",
      "oldCode": "exact code to replace (can be empty for new files)",
      "newCode": "replacement code"
    }
  ],
  "explanation": "string describing why this fix works"
}
`;

    return prompt;
  }

  /**
   * Call Perplexity API
   */
  private async callPerplexityAPI(prompt: string): Promise<AIFixResponse | null> {
    try {
      const responseText = await callPerplexity({
        messages: [
          {
            role: 'system',
            content: 'You are a code fixing assistant that analyzes deployment failures and provides precise fixes. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        maxTokens: 4096,
      });

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON found in Perplexity response', { response: responseText });
        return null;
      }

      const aiResponse = JSON.parse(jsonMatch[0]) as AIFixResponse;

      // Validate structure
      if (!aiResponse.rootCause || !aiResponse.filesToChange || !aiResponse.explanation) {
        logger.error('Invalid AI response structure', { aiResponse });
        return null;
      }

      return aiResponse;
    } catch (error) {
      logger.error('Perplexity API call failed', { error: String(error) });
      throw error;
    }
  }
}

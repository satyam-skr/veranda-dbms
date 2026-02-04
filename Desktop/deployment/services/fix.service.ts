import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { createInstallationClient } from '../lib/github';
import { logger } from '../utils/logger';
import { AIFixResponse } from '../lib/types';
import { FixValidator } from './fix-validator.service';
import { SyntaxChecker } from './syntax-checker.service';

export class FixService {
  async applyFixAndCommit(
    failureRecordId: string,
    aiResponse: AIFixResponse,
    aiPromptSent: string
  ): Promise<{ branchName: string; fixAttemptId: string } | null> {
    console.log('\n' + '📤'.repeat(40));
    console.log('📤 [Fix] APPLYING FIX TO GITHUB');
    console.log('📤'.repeat(40));
    
    try {
      logger.info('Applying fix', { failureRecordId });

      const { data: failureRecord, error } = await supabaseAdmin
        .from('failure_records')
        .select(`
          *,
          vercel_projects!inner (
            id,
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

      if (error || !failureRecord) {
        logger.error('Failed to fetch failure record', { error });
        return null;
      }

      const installation =
        failureRecord.vercel_projects.github_installations;

      const token = await decryptToken(
        installation.installation_token
      );

      if (!token) {
        logger.error('No installation token');
        return null;
      }

      const octokit = await createInstallationClient(
        installation.installation_id
      );

      const { data: repo } = await octokit.rest.repos.get({
        owner: installation.repo_owner,
        repo: installation.repo_name,
      });

      const defaultBranch = repo.default_branch ?? 'main';

      const { data: branchData } =
        await octokit.rest.repos.getBranch({
          owner: installation.repo_owner,
          repo: installation.repo_name,
          branch: defaultBranch,
        });

      const branchName = `autofix/attempt-${Date.now()}-${nanoid(6)}`;

      await octokit.rest.git.createRef({
        owner: installation.repo_owner,
        repo: installation.repo_name,
        ref: `refs/heads/${branchName}`,
        sha: branchData.commit.sha,
      });

      console.log(`🌿 [Fix] Branch created: ${branchName}`);
      logger.info('Created branch', { branchName });

      let didChangeAnything = false;

      for (const file of aiResponse.filesToChange) {
        let currentContent = '';
        let currentSha: string | undefined;

        try {
          const { data } = await octokit.rest.repos.getContent({
            owner: installation.repo_owner,
            repo: installation.repo_name,
            path: file.filename,
            ref: branchName,
          });

          if ('content' in data) {
            currentContent = Buffer.from(
              data.content,
              'base64'
            ).toString('utf-8');
            currentSha = data.sha;
          }
        } catch {
          // file does not exist
        }

        const newContent = file.oldCode
          ? currentContent.replace(file.oldCode, file.newCode)
          : file.newCode;

        if (currentContent.trim() !== newContent.trim()) {
          didChangeAnything = true;
        }

        const validation = await FixValidator.validateFix(
          file.filename,
          '',
          newContent,
          '',
          currentContent,
          async () => true
        );

        if (!validation.isValid) {
          logger.error('[Fix] Validation failed during apply', {
            file: file.filename,
            reason: validation.reason,
            details: validation.details,
            errors: validation.errors,
            failureRecordId,
          });
          return null;
        }

        // 🧪 SAFEGUARD #4: PRE-PUSH SYNTAX CHECK
        logger.info('🧪 [Fix] Running pre-push syntax check...', { filename: file.filename });
        const syntaxCheck = await SyntaxChecker.validateJavaScript(
          newContent,
          file.filename
        );

        if (!syntaxCheck.valid) {
          logger.error('❌ [Fix] Syntax check FAILED - not pushing to GitHub', {
            errors: syntaxCheck.errors,
            filename: file.filename,
            failureRecordId
          });
          // DON'T return null - instead, tell AI to try again with the syntax error
          // (Actually in this structure, returning null triggers a retry in autofix.ts loop)
          return null;
        }

        logger.info('✅ [Fix] Syntax check passed', { filename: file.filename });

        await octokit.rest.repos.createOrUpdateFileContents({
          owner: installation.repo_owner,
          repo: installation.repo_name,
          path: file.filename,
          branch: branchName,
          message: `[AutoFix] ${aiResponse.rootCause || 'Applied build fix'}`,
          content: Buffer.from(newContent).toString('base64'),
          ...(currentSha ? { sha: currentSha } : {}),
        });

        console.log(`✅ [Fix] Updated file: ${file.filename}`);
        logger.info('Updated file', { filename: file.filename });
      }

      // 🔴 HARD STOP: NO DIFF = NO SUCCESS
      if (!didChangeAnything) {
        logger.error('❌ [Fix] No actual code changes were made', {
          reason: 'no_changes',
          failureRecordId,
          filesAttempted: aiResponse.filesToChange.map((f: any) => f.filename),
          attemptNumber: failureRecord.attempt_count + 1,
          details: 'All files had identical content after replacement',
        });
        return null;
      }

      const { data: fixAttempt } = await supabaseAdmin
        .from('fix_attempts')
        .insert({
          failure_record_id: failureRecordId,
          attempt_number: failureRecord.attempt_count + 1,
          ai_prompt_sent: aiPromptSent,
          ai_response: aiResponse,
          files_changed: aiResponse.filesToChange,
          applied_branch: branchName,
        })
        .select()
        .single();

      await supabaseAdmin
        .from('failure_records')
        .update({
          attempt_count: failureRecord.attempt_count + 1,
          current_branch: branchName,
        })
        .eq('id', failureRecordId);

      logger.info('Fix applied successfully', {
        branchName,
        fixAttemptId: fixAttempt.id,
      });

      return {
        branchName,
        fixAttemptId: fixAttempt.id,
      };
    } catch (error) {
      logger.error('[Fix] Apply fix failed with exception', {
        failureRecordId,
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'apply_and_commit',
      });
      return null;
    }
  }
}

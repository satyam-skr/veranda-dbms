import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { createInstallationClient } from '../lib/github';
import { logger } from '../utils/logger';
import { AIFixResponse } from '../lib/types';

export class FixService {
  /**
   * Apply AI-generated fix and commit to GitHub
   */
  async applyFixAndCommit(
    failureRecordId: string,
    aiResponse: AIFixResponse,
    aiPromptSent: string
  ): Promise<{ branchName: string; fixAttemptId: string } | null> {
    try {
      logger.info('Applying fix', { failureRecordId });

      // Fetch failure record with related data
      const { data: failureRecord, error } = await supabaseAdmin
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

      if (error || !failureRecord) {
        logger.error('Failed to fetch failure record', { error });
        return null;
      }

      const vercelProject = failureRecord.vercel_projects;
      const installation = vercelProject.github_installations;

      // Decrypt installation token
      const installationToken = installation.installation_token
        ? await decryptToken(installation.installation_token)
        : null;

      if (!installationToken) {
        logger.error('No installation token', { installationId: installation.id });
        return null;
      }

      // Create GitHub client
      const octokit = await createInstallationClient(installation.installation_id);

      // Generate unique branch name
      const timestamp = Date.now();
      const randomId = nanoid(6);
      const branchName = `autofix/attempt-${timestamp}-${randomId}`;

      // Get default branch
      const { data: repoData } = await octokit.rest.repos.get({
        owner: installation.repo_owner,
        repo: installation.repo_name,
      });

      const defaultBranch = repoData.default_branch || 'main';

      // Get latest commit SHA on default branch
      const { data: branchData } = await octokit.rest.repos.getBranch({
        owner: installation.repo_owner,
        repo: installation.repo_name,
        branch: defaultBranch,
      });

      const latestCommitSha = branchData.commit.sha;

      // Create new branch
      await octokit.rest.git.createRef({
        owner: installation.repo_owner,
        repo: installation.repo_name,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      });

      logger.info('Created branch', { branchName });

      // Apply file changes
      for (const file of aiResponse.filesToChange) {
        try {
          // Fetch current file content
          let currentSha: string | undefined;
          let currentContent = '';

          try {
            const { data: fileData } = await octokit.rest.repos.getContent({
              owner: installation.repo_owner,
              repo: installation.repo_name,
              path: file.filename,
              ref: defaultBranch,
            });

            if ('content' in fileData) {
              currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
              currentSha = fileData.sha;
            }
          } catch (e) {
            // File doesn't exist, will create new
          }

          // Apply changes
          let newContent: string;
          if (file.oldCode && currentContent) {
            // Replace old code with new code
            newContent = currentContent.replace(file.oldCode, file.newCode);
            
            // If replacement didn't work, log warning but use new code
            if (newContent === currentContent && file.oldCode !== file.newCode) {
              logger.warn('Old code not found in file, using new code as-is', { filename: file.filename });
              newContent = file.newCode;
            }
          } else {
            // Use new code directly
            newContent = file.newCode;
          }

          // Encode to base64
          const encodedContent = Buffer.from(newContent).toString('base64');

          // Commit file change
          await octokit.rest.repos.createOrUpdateFileContents({
            owner: installation.repo_owner,
            repo: installation.repo_name,
            path: file.filename,
            message: `fix: AutoFix applied AI-generated fix for: ${aiResponse.rootCause} (Attempt ${failureRecord.attempt_count + 1})`,
            content: encodedContent,
            branch: branchName,
            sha: currentSha,
          });

          logger.info('Updated file', { filename: file.filename, branchName });
        } catch (fileError) {
          logger.error('Failed to update file', {
            filename: file.filename,
            error: String(fileError),
          });
          throw fileError;
        }
      }

      // Insert fix attempt record
      const { data: fixAttempt, error: insertError } = await supabaseAdmin
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

      if (insertError || !fixAttempt) {
        logger.error('Failed to insert fix attempt', { error: insertError });
        return null;
      }

      // Update failure record
      await supabaseAdmin
        .from('failure_records')
        .update({
          attempt_count: failureRecord.attempt_count + 1,
          current_branch: branchName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', failureRecordId);

      logger.info('Fix applied successfully', { branchName, fixAttemptId: fixAttempt.id });

      return {
        branchName,
        fixAttemptId: fixAttempt.id,
      };
    } catch (error) {
      logger.error('Apply fix failed', { failureRecordId, error: String(error) });
      return null;
    }
  }
}

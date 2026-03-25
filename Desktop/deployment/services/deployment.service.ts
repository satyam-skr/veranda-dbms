import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { VercelClient } from '../lib/vercel';
import { logger } from '../utils/logger';

export class DeploymentService {
  /**
   * Trigger deployment via deploy hook or API
   */
  async triggerDeployment(
    vercelProjectId: string,
    branchName: string,
    fixAttemptId: string
  ): Promise<string | null> {
    try {
      logger.info('Triggering deployment', { vercelProjectId, branchName });

      // Fetch Vercel project WITH GitHub installation details
      const { data: project, error } = await supabaseAdmin
        .from('vercel_projects')
        .select(`
          *,
          github_installations!inner (
            repo_owner,
            repo_name
          )
        `)
        .eq('id', vercelProjectId)
        .single();

      if (error || !project) {
        logger.error('Failed to fetch Vercel project', { error });
        return null;
      }

      // Decrypt Vercel token
      const vercelToken = await decryptToken(project.vercel_token);
      const vercelClient = new VercelClient(vercelToken);

      let deploymentId: string | null = null;

      // Try deploy hook first if available
      if (project.deploy_hook_url) {
        try {
          await vercelClient.triggerDeployHook(project.deploy_hook_url, branchName);
          logger.info('Deploy hook triggered', { branchName });

          // Wait a bit for deployment to be created
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Find the deployment by polling
          const deployments = await vercelClient.getDeployments(project.project_id, 5);
          const latestDeployment = deployments.find(d => d.gitSource?.ref === branchName);

          if (latestDeployment) {
            deploymentId = latestDeployment.id;
          }
        } catch (hookError) {
          logger.warn('Deploy hook failed, falling back to API', { error: String(hookError) });
        }
      }

      // Fall back to API if hook didn't work
      if (!deploymentId) {
        try {
          const installation = project.github_installations;
          const repoFullName = `${installation.repo_owner}/${installation.repo_name}`;
          
          logger.info('Creating deployment via API', { 
            projectName: project.project_name,
            repo: repoFullName,
            branch: branchName,
            githubRepoId: project.github_repo_id, // Now available from database
          });

          // Build gitSource with repoId if available
          const gitSource: any = {
            type: 'github',
            ref: branchName,
          };

          // Add repoId if we have it (prevents "repoId required" error)
          if (project.github_repo_id) {
            gitSource.repoId = project.github_repo_id;
          }

          const deployment = await vercelClient.createDeployment({
            name: project.project_name,
            gitSource,
            // Don't set target - Vercel auto-determines it for Git-based deployments
          });

          deploymentId = deployment.id;
          logger.info('Deployment created via API', { deploymentId });
        } catch (apiError) {
          logger.error('Failed to create deployment via API', { error: String(apiError) });
          return null;
        }
      }

      if (!deploymentId) {
        logger.error('No deployment ID obtained');
        return null;
      }

      // Update fix attempt with deployment ID
      await supabaseAdmin
        .from('fix_attempts')
        .update({ new_deployment_id: deploymentId })
        .eq('id', fixAttemptId);

      return deploymentId;
    } catch (error) {
      logger.error('Trigger deployment failed', { error: String(error) });
      return null;
    }
  }

  /**
   * Poll deployment status until complete
   */
  async pollDeploymentStatus(
    deploymentId: string,
    vercelToken: string,
    fixAttemptId: string
  ): Promise<{ status: 'success' | 'failed' | 'timeout'; logs?: string }> {
    const vercelClient = new VercelClient(vercelToken);
    const maxAttempts = 120; // 30 minutes with 15 second intervals
    const pollInterval = 15000; // 15 seconds

    logger.info('Starting deployment polling', { deploymentId });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const deployment = await vercelClient.getDeployment(deploymentId);

        // Log full state for debugging
        logger.info('Deployment status', { 
          deploymentId, 
          state: deployment.state,
          readyState: deployment.readyState,
          attempt 
        });

        // Check for success - Vercel uses 'READY' or readyState === 'READY'
        if (deployment.state === 'READY' || deployment.readyState === 'READY') {
          // Success!
          await supabaseAdmin
            .from('fix_attempts')
            .update({ deployment_status: 'success' })
            .eq('id', fixAttemptId);

          logger.info('Deployment succeeded', { deploymentId });
          return { status: 'success' };
        }

        // Check for failure - Vercel might use different state values
        const failureStates = ['ERROR', 'CANCELED', 'FAILED', 'error', 'canceled', 'failed'];
        const stateValue = deployment.state || '';
        const readyStateValue = deployment.readyState || '';
        
        if (failureStates.includes(stateValue) || 
            failureStates.includes(readyStateValue) ||
            deployment.errorMessage) {
          // Failed - fetch logs
          const logs = await vercelClient.getDeploymentLogs(deploymentId);

          await supabaseAdmin
            .from('fix_attempts')
            .update({ deployment_status: 'failed' })
            .eq('id', fixAttemptId);

          logger.info('Deployment failed', { deploymentId, state: deployment.state, readyState: deployment.readyState });
          return { status: 'failed', logs };
        }

        // Still building, continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (pollError) {
        logger.error('Polling error', { deploymentId, attempt, error: String(pollError) });
        
        // Continue polling despite errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout
    logger.warn('Deployment polling timeout', { deploymentId });
    return { status: 'timeout' };
  }
}

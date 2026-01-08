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

      // Fetch Vercel project
      const { data: project, error } = await supabaseAdmin
        .from('vercel_projects')
        .select('*')
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
          const deployment = await vercelClient.createDeployment({
            name: project.project_name,
            gitSource: {
              type: 'github',
              ref: branchName,
            },
            target: 'preview',
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

        logger.info('Deployment status', { deploymentId, state: deployment.state, attempt });

        if (deployment.state === 'READY') {
          // Success!
          await supabaseAdmin
            .from('fix_attempts')
            .update({ deployment_status: 'success' })
            .eq('id', fixAttemptId);

          logger.info('Deployment succeeded', { deploymentId });
          return { status: 'success' };
        }

        if (deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
          // Failed - fetch logs
          const logs = await vercelClient.getDeploymentLogs(deploymentId);

          await supabaseAdmin
            .from('fix_attempts')
            .update({ deployment_status: 'failed' })
            .eq('id', fixAttemptId);

          logger.info('Deployment failed', { deploymentId, state: deployment.state });
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

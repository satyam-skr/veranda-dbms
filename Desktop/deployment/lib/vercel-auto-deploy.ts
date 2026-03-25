import { supabaseAdmin } from '../lib/supabase';
import { createInstallationClient } from '../lib/github';
import { VercelClient } from '../lib/vercel';
import { encryptToken } from '../lib/encryption';
import { logger } from '../utils/logger';

/**
 * Automated Vercel deployment service
 * Automatically creates Vercel projects and deploys GitHub repositories
 */
export class VercelAutoDeployService {
  private vercelToken: string;

  constructor(vercelToken?: string) {
    // Use provided token or fall back to environment variable
    this.vercelToken = vercelToken || process.env.VERCEL_TEAM_TOKEN!;
    
    if (!this.vercelToken) {
      throw new Error('VERCEL_TEAM_TOKEN is required for auto-deployment');
    }
  }

  /**
   * Automatically create a Vercel project and deploy a GitHub repository
   * This is called after user connects their GitHub repo
   */
  async autoDeployRepository(params: {
    userId: string;
    githubInstallationId: string;
    installationId: number;
    repoOwner: string;
    repoName: string;
  }): Promise<{
    vercelProjectId: string;
    deploymentId: string;
    deploymentUrl: string;
  }> {
    try {
      logger.info('🚀 [AutoDeploy] Starting automatic deployment', {
        repo: `${params.repoOwner}/${params.repoName}`,
      });

      // Step 1: Get GitHub repo details (including repo ID)
      const githubRepoId = await this.fetchGitHubRepoId(
        params.installationId,
        params.repoOwner,
        params.repoName
      );

      logger.info('✅ [AutoDeploy] Fetched GitHub repo ID', { githubRepoId });

      // Step 2: Create Vercel project
      const vercelClient = new VercelClient(this.vercelToken);
      const project = await this.createVercelProject(
        vercelClient,
        params.repoOwner,
        params.repoName,
        githubRepoId
      );

      logger.info('✅ [AutoDeploy] Created Vercel project', {
        projectId: project.id,
        projectName: project.name,
      });

      // Step 3: Trigger initial deployment
      const deployment = await this.triggerInitialDeployment(
        vercelClient,
        project.name,
        params.repoOwner,
        params.repoName,
        githubRepoId
      );

      logger.info('✅ [AutoDeploy] Triggered initial deployment', {
        deploymentId: deployment.id,
        deploymentUrl: deployment.url,
      });

      // Step 4: Store in database (Upsert to handle existing projects)
      const encryptedToken = await encryptToken(this.vercelToken);
      
      const { data: vercelProject, error: upsertError } = await supabaseAdmin
        .from('vercel_projects')
        .upsert({
          user_id: params.userId,
          github_installation_id: params.githubInstallationId,
          project_id: project.id,
          project_name: project.name,
          vercel_token: encryptedToken,
          github_repo_id: githubRepoId,
          last_checked_deployment_id: deployment.id,
          updated_at: new Date().toISOString(),
          // Don't overwrite created_at
        }, {
          onConflict: 'project_id',
          ignoreDuplicates: false // We want to update the latest deployment ID
        })
        .select()
        .single();

      if (upsertError || !vercelProject) {
        throw new Error(`Failed to store Vercel project: ${upsertError?.message}`);
      }

      logger.info('✅ [AutoDeploy] Stored/Updated Vercel project in database', {
        vercelProjectId: vercelProject.id,
      });

      return {
        vercelProjectId: vercelProject.id,
        deploymentId: deployment.id,
        deploymentUrl: deployment.url || `https://${project.name}.vercel.app`,
      };
    } catch (error) {
      logger.error('❌ [AutoDeploy] Auto-deployment failed', {
        error: String(error),
        repo: `${params.repoOwner}/${params.repoName}`,
      });
      throw error;
    }
  }

  /**
   * Fetch GitHub repository ID using GitHub API
   */
  private async fetchGitHubRepoId(
    installationId: number,
    repoOwner: string,
    repoName: string
  ): Promise<number> {
    try {
      const octokit = await createInstallationClient(installationId);
      
      const { data: repo } = await octokit.rest.repos.get({
        owner: repoOwner,
        repo: repoName,
      });

      return repo.id;
    } catch (error) {
      logger.error('Failed to fetch GitHub repo ID', {
        error: String(error),
        repo: `${repoOwner}/${repoName}`,
      });
      throw new Error(`Could not fetch GitHub repo: ${String(error)}`);
    }
  }

  /**
   * Create a Vercel project linked to GitHub repository
   */
  private async createVercelProject(
    vercelClient: VercelClient,
    repoOwner: string,
    repoName: string,
    githubRepoId: number
  ): Promise<any> {
    try {
      // Vercel's project creation API
      const response = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.sanitizeProjectName(repoName),
          framework: null, // Auto-detect framework
          gitRepository: {
            type: 'github',
            repo: `${repoOwner}/${repoName}`,
          },
          environmentVariables: [],
          buildCommand: null, // Use defaults
          devCommand: null,
          installCommand: null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Keep raw text
        }

        // Handle "Project already exists" error
        if (response.status === 409 || errorData?.error?.code === 'conflict') {
          logger.info(`ℹ️ [AutoDeploy] Project "${repoName}" already exists, using existing project`);
          const existingProject = await vercelClient.getProject(this.sanitizeProjectName(repoName));
          return existingProject;
        }

        throw new Error(`Vercel project creation failed: ${errorText}`);
      }

      const project = await response.json();
      return project;
    } catch (error) {
      logger.error('Failed to create Vercel project', {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Trigger initial deployment for the newly created project
   */
  private async triggerInitialDeployment(
    vercelClient: VercelClient,
    projectName: string,
    repoOwner: string,
    repoName: string,
    githubRepoId: number
  ): Promise<any> {
    try {
      // Create deployment using Vercel API
      const deployment = await vercelClient.createDeployment({
        name: projectName,
        gitSource: {
          type: 'github',
          ref: 'main', // Try main branch first, will fall back to master if needed
          repoId: String(githubRepoId),
        },
        target: 'production',
      });

      return deployment;
    } catch (mainBranchError) {
      // If main branch fails, try master branch
      logger.warn('Main branch failed, trying master', {
        error: String(mainBranchError),
      });

      try {
        const deployment = await vercelClient.createDeployment({
          name: projectName,
          gitSource: {
            type: 'github',
            ref: 'master',
            repoId: String(githubRepoId),
          },
          target: 'production',
        });

        return deployment;
      } catch (masterBranchError) {
        logger.error('Both main and master branches failed', {
          mainError: String(mainBranchError),
          masterError: String(masterBranchError),
        });
        throw new Error('Could not deploy: no valid branch found (tried main and master)');
      }
    }
  }

  /**
   * Sanitize project name for Vercel
   * Vercel requires lowercase alphanumeric + hyphens
   */
  private sanitizeProjectName(repoName: string): string {
    return repoName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Check deployment status
   */
  async checkDeploymentStatus(deploymentId: string): Promise<{
    state: string;
    url?: string;
    error?: string;
  }> {
    try {
      const vercelClient = new VercelClient(this.vercelToken);
      const deployment = await vercelClient.getDeployment(deploymentId);

      return {
        state: deployment.state,
        url: deployment.url,
        error: deployment.errorMessage,
      };
    } catch (error) {
      logger.error('Failed to check deployment status', {
        error: String(error),
        deploymentId,
      });
      throw error;
    }
  }
}

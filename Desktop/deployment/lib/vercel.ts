import { VercelDeployment } from './types';

/**
 * Vercel API client wrapper
 */
export class VercelClient {
  private token: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get latest deployments for a project
   */
  async getDeployments(projectId: string, limit: number = 1): Promise<VercelDeployment[]> {
    const data = await this.request<{ deployments: VercelDeployment[] }>(
      `/v6/deployments?projectId=${projectId}&limit=${limit}`
    );
    return data.deployments;
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request<VercelDeployment>(`/v13/deployments/${deploymentId}`);
  }

  /**
   * Get deployment build logs
   * Fetches deployment details and extracts error information
   */
  async getDeploymentLogs(deploymentId: string, projectId?: string): Promise<string> {
    try {
      // First, try to get the deployment object which contains error info
      const deployment = await this.getDeployment(deploymentId);
      
      // Extract error information from the deployment object
      let logs = '';
      
      if (deployment.readyState === 'ERROR' && deployment.errorMessage) {
        logs += `Error: ${deployment.errorMessage}\n`;
      }
      
      if (deployment.errorCode) {
        logs += `Error Code: ${deployment.errorCode}\n`;
      }
      
      // Try to get build logs from events API (best effort)
      try {
        const params = new URLSearchParams();
        if (projectId) params.append('projectId', projectId);
        params.append('limit', '100');
        
        const response = await fetch(`${this.baseUrl}/v2/deployments/${deploymentId}/events?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (response.ok) {
          const text = await response.text();
          const lines = text.trim().split('\n');
          
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              if ((event.type === 'stdout' || event.type === 'stderr') && event.payload?.text) {
                logs += event.payload.text + '\n';
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      } catch (eventsError) {
        // Events API failed, but we continue with deployment object info
        console.log('Events API unavailable, using deployment object only');
      }
      
      // If we still have no logs, provide a generic error message
      if (!logs || logs.trim().length === 0) {
        logs = `Build failed for deployment ${deploymentId}. ReadyState: ${deployment.readyState}. Please check build configuration and dependencies.`;
      }
      
      return logs;
    } catch (error) {
      // Fallback: return a generic error that allows the fix process to continue
      return `Build failed for deployment ${deploymentId}. Error details unavailable. Common issues: missing dependencies, syntax errors, or build configuration problems.`;
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<any> {
    return this.request(`/v9/projects/${projectId}`);
  }

  /**
   * Trigger deployment via deploy hook
   */
  async triggerDeployHook(hookUrl: string, gitRef?: string): Promise<any> {
    const response = await fetch(hookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: gitRef ? JSON.stringify({ gitSource: { ref: gitRef } }) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Deploy hook failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create deployment via API
   */
  async createDeployment(params: {
    name: string;
    gitSource: {
      type: string;
      ref: string;
      repoId?: string;
    };
    target?: string;
  }): Promise<VercelDeployment> {
    return this.request<VercelDeployment>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a webhook for the project
   */
  async createWebhook(projectId: string, url: string): Promise<any> {
    return this.request('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events: [
          'deployment.created',
          'deployment.error',
          'deployment.succeeded',
          'deployment.canceled'
        ],
        projectIds: [projectId],
      }),
    });
  }
}

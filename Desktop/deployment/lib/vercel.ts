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
   */
  async getDeploymentLogs(deploymentId: string, projectId?: string): Promise<string> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('direction', 'backward');
    
    const response = await fetch(`${this.baseUrl}/v2/deployments/${deploymentId}/events?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    
    let logs = '';
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

    return logs;
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
}

import { Octokit } from '@octokit/rest';
import { App } from '@octokit/app';

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n');

// Create GitHub App instance
export const githubApp = new App({
  appId: GITHUB_APP_ID,
  privateKey: GITHUB_APP_PRIVATE_KEY,
});

/**
 * Create an Octokit instance with installation token
 */
export async function createInstallationClient(installationId: number): Promise<any> {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  return octokit;
}

/**
 * Create an Octokit instance with personal access token
 */
export function createTokenClient(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

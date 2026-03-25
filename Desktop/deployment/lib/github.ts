import { Octokit } from '@octokit/rest';
// import { App } from '@octokit/app';
import { createAppAuth } from '@octokit/auth-app';

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n');
console.log("🔑 Key Formatted: Length", GITHUB_APP_PRIVATE_KEY.length);

// Create GitHub App instance (kept for backward compatibility if needed)
// Create GitHub App instance (kept for backward compatibility if needed)
// export const githubApp = new App({
//   appId: GITHUB_APP_ID,
//   privateKey: GITHUB_APP_PRIVATE_KEY,
// });

/**
 * Create an Octokit instance with installation token
 * 
 * NOTE: This generates a FRESH token every time (valid for 1 hour).
 * This is better than storing tokens because:
 * - No expiration issues
 * - More secure (no storage)
 * - Always up-to-date permissions
 */
export async function createInstallationClient(installationId: number): Promise<Octokit> {
  // Generate a fresh token using GitHub App credentials
  const auth = createAppAuth({
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
  });

  const installationAuth = await auth({
    type: 'installation',
    installationId: installationId,
  });

  // Create Octokit with the fresh token
  return new Octokit({
    auth: installationAuth.token,
  });
}

/**
 * Create an Octokit instance with personal access token
 */
export function createTokenClient(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

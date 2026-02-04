/**
 * AutoFix Configuration and Detection Utilities
 * 
 * Centralized logic for detecting AutoFix-generated deployments
 * and checking the global kill switch.
 */

export interface DeploymentMetadata {
  gitSource?: {
    ref?: string;  // branch name
    sha?: string;
  };
  meta?: {
    githubCommitMessage?: string;
  };
}

export interface AutoFixDetectionResult {
  isAutoFix: boolean;
  reason: 'branch_match' | 'commit_marker' | null;
}

/**
 * Check if AutoFix is globally enabled via environment variable.
 * Defaults to true if not set.
 */
export function isAutoFixEnabled(): boolean {
  const envValue = process.env.AUTOFIX_ENABLED;
  if (envValue === undefined || envValue === '') {
    return true; // Enabled by default
  }
  return envValue.toLowerCase() === 'true';
}

/**
 * Check if a deployment was created by AutoFix.
 * Uses dual-signal detection: branch prefix OR commit message marker.
 * 
 * DEFENSIVE: Tolerates missing metadata.
 * - If branch is undefined → still check commit
 * - If commit is undefined → still check branch
 * - If both are missing → returns false (do NOT skip)
 */
export function isAutoFixDeployment(deployment: DeploymentMetadata): AutoFixDetectionResult {
  const branch = deployment.gitSource?.ref;
  const commitMessage = deployment.meta?.githubCommitMessage;

  // Check branch prefix (e.g., "autofix/attempt-123-abc")
  if (branch && branch.startsWith('autofix/')) {
    return { isAutoFix: true, reason: 'branch_match' };
  }

  // Check commit message marker
  if (commitMessage && commitMessage.includes('[AutoFix]')) {
    return { isAutoFix: true, reason: 'commit_marker' };
  }

  // Neither signal present or matched
  return { isAutoFix: false, reason: null };
}

/**
 * Get a human-readable skip reason for logging
 */
export function getSkipReasonMessage(reason: AutoFixDetectionResult['reason']): string {
  switch (reason) {
    case 'branch_match':
      return 'Skipping AutoFix deployment (branch match)';
    case 'commit_marker':
      return 'Skipping AutoFix deployment (commit marker)';
    default:
      return 'Skipping AutoFix deployment';
  }
}

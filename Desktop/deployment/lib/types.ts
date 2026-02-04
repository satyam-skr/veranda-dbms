// User types
export interface User {
  id: string;
  email: string;
  githubUsername: string;
  githubAccessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

// GitHub Installation types
export interface GitHubInstallation {
  id: string;
  userId: string;
  installationId: number;
  repoOwner: string;
  repoName: string;
  installationToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Vercel Project types
export interface VercelProject {
  id: string;
  userId: string;
  githubInstallationId: string;
  projectId: string;
  projectName: string;
  vercelToken: string;
  deployHookUrl?: string;
  lastCheckedDeploymentId?: string;
  isFixing?: boolean;  // Project-level lock for AutoFix
  createdAt: Date;
  updatedAt: Date;
}

// Failure Status type
export type FailureStatus = 'pending_analysis' | 'fixing' | 'fixed_successfully' | 'failed_after_max_retries' | 'failed_unfixable';

// Failure Record types
export interface FailureRecord {
  id: string;
  vercelProjectId: string;
  deploymentId: string;
  failureSource: string;
  logs: string;
  status: FailureStatus;
  attemptCount: number;
  currentBranch?: string;
  isManualRetry?: boolean;  // Track manual retry attempts
  createdAt: Date;
  updatedAt: Date;
}

// Fix Attempt types
export interface FixAttempt {
  id: string;
  failureRecordId: string;
  attemptNumber: number;
  aiPromptSent: string;
  aiResponse: AIFixResponse;
  filesChanged: FileChange[];
  appliedBranch: string;
  newDeploymentId?: string;
  deploymentStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Fix Response types
export interface AIFixResponse {
  rootCause: string;
  filesToChange: FileChange[];
  explanation: string;
  errorClassification?: {
    category: string;
    isFixable: boolean;
    confidence: number;
    reasoning: string;
    userActionRequired?: string;
    suggestedFix?: string;
  };
}

export interface FileChange {
  filename: string;
  oldCode: string;
  newCode: string;
}

// Vercel Deployment types
export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  readyState?: string;
  errorMessage?: string;
  errorCode?: string;
  created: number;
  target?: string;
  gitSource?: {
    type: string;
    repoId: string;
    ref: string;
    sha: string;
  };
}

export interface VercelBuildLog {
  id: string;
  text: string;
  timestamp: number;
}

// GitHub File types
export interface GitHubFile {
  path: string;
  content: string; // base64 encoded
  sha: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Extended types for frontend
export interface RepoWithStatus extends GitHubInstallation {
  vercelProject?: VercelProject;
  lastDeploymentStatus?: 'healthy' | 'failed' | 'fixing';
  lastDeploymentTime?: Date;
}

export interface FailureWithDetails extends FailureRecord {
  repoName: string;
  repoOwner: string;
  projectName: string;
  fixAttempts?: FixAttempt[];
}

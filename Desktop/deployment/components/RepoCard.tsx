'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RepoCardProps {
  repo: {
    id: string;
    repo_owner: string;
    repo_name: string;
    vercel_projects?: Array<{
      id: string;
      project_name: string;
      last_checked_deployment_id?: string;
    }>;
  };
  status?: 'healthy' | 'failed' | 'fixing' | 'action_required';
}

export function RepoCard({ repo, status = 'healthy' }: RepoCardProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const hasVercelProject = repo.vercel_projects && repo.vercel_projects.length > 0;

  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      text: 'Healthy',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
    },
    failed: {
      color: 'bg-red-500',
      text: 'Failed',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    fixing: {
      color: 'bg-yellow-500',
      text: 'Fixing',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
    },
    action_required: {
      color: 'bg-orange-500',
      text: 'Action Required',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
  };

  const config = statusConfig[status];

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

    try {
      const response = await fetch('/api/deploy-to-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubInstallationId: repo.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Deployment failed');
      }

      setDeploySuccess(true);
      // Reload page after 2 seconds to show new deployment
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setDeployError(String(error));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {repo.repo_owner}/{repo.repo_name}
            </h3>
            {hasVercelProject && (
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bgColor} ${config.textColor}`}>
                <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
                {config.text}
              </span>
            )}
          </div>
          
          {hasVercelProject ? (
            <p className="text-sm text-gray-600 mt-2">
              Linked to: <span className="font-medium">{repo.vercel_projects![0].project_name}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Not deployed yet
            </p>
          )}

          {deployError && (
            <p className="text-sm text-red-600 mt-2">Error: {deployError}</p>
          )}

          {deploySuccess && (
            <p className="text-sm text-green-600 mt-2">✅ Deployment started!</p>
          )}
        </div>

        <div className="flex gap-2">
          {hasVercelProject ? (
            <Link
              href="/failures"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Details →
            </Link>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeploying ? '🚀 Deploying...' : '🚀 Deploy to Vercel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

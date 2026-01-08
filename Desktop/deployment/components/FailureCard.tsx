import Link from 'next/link';
import { FailureStatus } from '@/lib/types';

interface FailureCardProps {
  failure: {
    id: string;
    deployment_id: string;
    status: FailureStatus;
    attempt_count: number;
    created_at: string;
    vercel_projects?: {
      project_name: string;
      github_installations?: {
        repo_owner: string;
        repo_name: string;
      };
    };
  };
}

export function FailureCard({ failure }: FailureCardProps) {
  const statusConfig: Record<FailureStatus, { color: string; text: string; bgColor: string }> = {
    pending_analysis: {
      color: 'bg-yellow-500',
      text: 'Analyzing',
      bgColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    fixing: {
      color: 'bg-blue-500',
      text: 'Fixing',
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    fixed_successfully: {
      color: 'bg-green-500',
      text: 'Fixed',
      bgColor: 'bg-green-50 text-green-700 border-green-200',
    },
    failed_after_max_retries: {
      color: 'bg-red-500',
      text: 'Failed',
      bgColor: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const config = statusConfig[failure.status];
  const installation = failure.vercel_projects?.github_installations;

  return (
    <Link href={`/failures/${failure.id}`}>
      <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor}`}>
                {config.text}
              </span>
              <span className="text-sm text-gray-500">
                Attempt {failure.attempt_count} of 5
              </span>
            </div>

            <h4 className="font-semibold text-gray-900">
              {installation
                ? `${installation.repo_owner}/${installation.repo_name}`
                : failure.vercel_projects?.project_name || 'Unknown Project'}
            </h4>

            <p className="text-sm text-gray-600 mt-1">
              Deployment: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{failure.deployment_id.slice(0, 12)}...</code>
            </p>

            <p className="text-xs text-gray-500 mt-2">
              {new Date(failure.created_at).toLocaleString()}
            </p>
          </div>

          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

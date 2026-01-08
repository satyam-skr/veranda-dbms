import Link from 'next/link';

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
  status?: 'healthy' | 'failed' | 'fixing';
}

export function RepoCard({ repo, status = 'healthy' }: RepoCardProps) {
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
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {repo.repo_owner}/{repo.repo_name}
            </h3>
            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bgColor} ${config.textColor}`}>
              <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
              {config.text}
            </span>
          </div>
          
          {repo.vercel_projects && repo.vercel_projects.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Linked to: <span className="font-medium">{repo.vercel_projects[0].project_name}</span>
            </p>
          )}
        </div>

        <Link
          href="/failures"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

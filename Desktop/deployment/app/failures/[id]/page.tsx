import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { FixAttemptCard } from '@/components/FixAttemptCard';
import Link from 'next/link';

async function getFailureDetail(id: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/failures/${id}`, {
      headers: {
        Cookie: `user_id=${userId.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.failure;
  } catch (error) {
    console.error('Failed to fetch failure:', error);
    return null;
  }
}

export default async function FailureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    redirect('/');
  }

  const { id } = await params;
  const failure = await getFailureDetail(id);

  if (!failure) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Failure Not Found</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  const installation = failure.vercel_projects?.github_installations;
  const statusConfig: Record<string, { color: string; text: string }> = {
    pending_analysis: { color: 'bg-yellow-100 text-yellow-700', text: 'Analyzing' },
    fixing: { color: 'bg-blue-100 text-blue-700', text: 'Fixing' },
    fixed_successfully: { color: 'bg-green-100 text-green-700', text: 'Fixed Successfully' },
    failed_after_max_retries: { color: 'bg-red-100 text-red-700', text: 'Failed After Max Retries' },
  };

  const config = statusConfig[failure.status] || statusConfig.pending_analysis;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/failures"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to Failures
        </Link>

        {/* Failure Metadata */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
           <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {installation
                  ? `${installation.repo_owner}/${installation.repo_name}`
                  : 'Deployment Failure'}
              </h1>
              <p className="text-gray-600">
                {failure.vercel_projects?.project_name}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full font-medium ${config.color}`}>
              {config.text}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Deployment ID</p>
              <p className="text-sm font-mono text-gray-900 mt-1">{failure.deployment_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Attempts</p>
              <p className="text-sm text-gray-900 mt-1">{failure.attempt_count} of 5</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(failure.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Deployment Logs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Deployment Logs</h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-xs text-green-400 font-mono">
              {failure.logs}
            </pre>
          </div>
        </div>

        {/* Fix Attempts Timeline */}
        {failure.fix_attempts && failure.fix_attempts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🔧 Fix Attempts Timeline</h2>
            <div className="space-y-6">
              {failure.fix_attempts.map((attempt: any, idx: number) => (
                <FixAttemptCard
                  key={attempt.id}
                  fixAttempt={{
                    ...attempt,
                    createdAt: attempt.created_at,
                    updatedAt: attempt.updated_at,
                    failureRecordId: attempt.failure_record_id,
                    attemptNumber: attempt.attempt_number,
                    aiPromptSent: attempt.ai_prompt_sent,
                    aiResponse: attempt.ai_response,
                    filesChanged: attempt.files_changed,
                    appliedBranch: attempt.applied_branch,
                    newDeploymentId: attempt.new_deployment_id,
                    deploymentStatus: attempt.deployment_status,
                  }}
                  isLast={idx === failure.fix_attempts.length - 1}
                />
              ))}
            </div>
 </div>
        )}

        {(!failure.fix_attempts || failure.fix_attempts.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">Analysis in progress...</p>
            <p className="text-gray-500 text-sm mt-2">
              AutoFix is analyzing the failure and will apply a fix shortly
            </p>
          </div>
        )}
      </main>
    </>
  );
}

import { FixAttempt } from '@/lib/types';

interface FixAttemptCardProps {
  fixAttempt: FixAttempt;
  isLast: boolean;
}

export function FixAttemptCard({ fixAttempt, isLast }: FixAttemptCardProps) {
  const isSuccess = fixAttempt.deploymentStatus === 'success';
  const isFailed = fixAttempt.deploymentStatus === 'failed';
  const isPending = !fixAttempt.deploymentStatus;

  return (
    <div className="border-l-4 border-blue-500 bg-white rounded-lg shadow p-6 ml-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-lg text-gray-900">
            Attempt #{fixAttempt.attemptNumber}
          </h4>
          <p className="text-sm text-gray-500">
            {new Date(fixAttempt.createdAt).toLocaleString()}
          </p>
        </div>

        <div>
          {isSuccess && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              ✓ Success
            </span>
          )}
          {isFailed && !isLast && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              ✗ Failed - Retrying...
            </span>
          )}
          {isFailed && isLast && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              ✗ Failed
            </span>
          )}
          {isPending && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium animate-pulse">
              ⏳ Processing...
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="font-medium text-gray-900 mb-2">🔍 AI Analysis</h5>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Root Cause:</p>
            <p className="text-sm text-gray-700">{fixAttempt.aiResponse.rootCause}</p>

            <p className="text-sm font-semibold text-blue-900 mt-3 mb-2">Explanation:</p>
            <p className="text-sm text-gray-700">{fixAttempt.aiResponse.explanation}</p>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 mb-2">📝 Files Changed</h5>
          <div className="space-y-3">
            {fixAttempt.filesChanged.map((file, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-sm font-mono font-semibold text-gray-900 mb-2">
                  {file.filename}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {file.oldCode && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">- Old Code</p>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto border border-red-200">
                        <code>{file.oldCode.slice(0, 200)}{file.oldCode.length > 200 ? '...' : ''}</code>
                      </pre>
                    </div>
                  )}
                  <div className={file.oldCode ? '' : 'col-span-2'}>
                    <p className="text-xs font-semibold text-green-600 mb-1">+ New Code</p>
                    <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto border border-green-200">
                      <code>{file.newCode.slice(0, 200)}{file.newCode.length > 200 ? '...' : ''}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 mb-2">🚀 Deployment</h5>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-sm">
              <span className="font-semibold">Branch:</span>{' '}
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">{fixAttempt.appliedBranch}</code>
            </p>
            {fixAttempt.newDeploymentId && (
              <p className="text-sm mt-2">
                <span className="font-semibold">Deployment ID:</span>{' '}
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">{fixAttempt.newDeploymentId}</code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/get-base-url';

export default function SetupCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [paramsDebug, setParamsDebug] = useState('');

  useEffect(() => {
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    const state = searchParams.get('state');

    // Debug info
    const paramsObj = Object.fromEntries(searchParams.entries());
    setParamsDebug(JSON.stringify(paramsObj, null, 2));

    if (installationId) {
      setStatus('redirecting');
      
      // Construct redirection URL to API
      // We use window.location to ensure a full page reload and clean state
      const apiUrl = `/api/github/installation-callback?${searchParams.toString()}`;
      window.location.href = apiUrl;
    } else {
      setStatus('error');
      setErrorMessage(
        'Missing installation_id parameter. This usually means the GitHub App is not configured correctly.'
      );
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-xl p-8 text-center">
        
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900">Verifying Connection...</h1>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900">Connection Successful!</h1>
            <p className="text-gray-600 mt-2">Finishing setup...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
            <p className="text-gray-700 mb-6">{errorMessage}</p>

            <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono overflow-auto mb-6">
              <p className="font-bold text-gray-500 mb-2">Received Parameters:</p>
              <pre>{paramsDebug}</pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left mb-6">
              <h3 className="font-bold text-blue-900 mb-2">How to Fix:</h3>
              <ol className="list-decimal list-inside text-blue-800 space-y-2 text-sm">
                <li>Go to your GitHub App Settings on GitHub.</li>
                <li>Find the <strong>"Setup URL"</strong> field.</li>
                <li>Set it to: <code className="bg-blue-100 px-1 rounded">https://autofix-platform.vercel.app/setup/callback</code></li>
                <li>Save changes and try connecting again.</li>
              </ol>
            </div>

            <Link
              href="/setup/connect-repo"
              className="inline-block px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Try Again
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

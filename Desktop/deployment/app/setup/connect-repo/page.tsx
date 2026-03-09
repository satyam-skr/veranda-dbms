'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectRepoPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user_id from cookie/localStorage (client-side)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Prefer the non-httpOnly debug cookie (visible to JS), then fall back
    // to any existing localStorage value as a safety net across redirects.
    let id = getCookie('user_id_debug') || getCookie('user_id');

    if (!id) {
      id = typeof window !== 'undefined' ? localStorage.getItem('autofix_user_id') : null;
    }

    if (!id) {
      router.push('/');
      return;
    }

    setUserId(id);
    // Persist to localStorage as a safety net for cross-site redirects
    localStorage.setItem('autofix_user_id', id);
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Pass user_id in 'state' param so it survives the round-trip to GitHub
  const githubAppUrl = `https://github.com/apps/autofix-arkin26/installations/select_target?state=${userId}`;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect GitHub Repository</h1>
        <p className="text-gray-600 mb-8">
          Install the AutoFix GitHub App to grant access to your repository. This allows AutoFix to:
        </p>

        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <span className="text-gray-700">Read repository files to analyze build errors</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <span className="text-gray-700">Create branches and commit AI-generated fixes</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <span className="text-gray-700">Monitor deployment status</span>
          </li>
        </ul>

        <a
          href={githubAppUrl}
          className="block w-full text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Install GitHub App
        </a>

        <p className="text-sm text-gray-500 mt-4 text-center">
          You'll be redirected to GitHub to authorize the installation
        </p>
      </div>
    </main>
  );
}

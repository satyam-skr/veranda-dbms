'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { RepoCard } from '@/components/RepoCard';
import { FailureCard } from '@/components/FailureCard';
import { RemoveAllReposButton } from '@/components/RemoveAllReposButton';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<any[]>([]);
  const [recentFailures, setRecentFailures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number; error?: string } | null>(null);

  const success = searchParams.get('success');
  const fail = searchParams.get('fail');
  const lastError = searchParams.get('last_error');
  const empty = searchParams.get('empty');

  const fetchData = async () => {
    try {
      const [reposRes, failuresRes] = await Promise.all([
        fetch('/api/repos'),
        fetch('/api/failures')
      ]);
      
      const reposData = await reposRes.json();
      const failuresData = await failuresRes.json();
      
      setRepos(reposData.repos || []);
      setRecentFailures((failuresData.failures || []).slice(0, 10));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/repos/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ count: data.syncedCount });
        await fetchData(); // Refresh list
      } else {
        setSyncResult({ count: 0, error: data.error || 'Sync failed' });
      }
    } catch (err) {
      setSyncResult({ count: 0, error: 'Network error during sync' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sync Results */}
        {syncResult && (
          <div className={`mb-8 p-4 rounded-lg border-l-4 ${syncResult.error ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
            <p className="font-bold">{syncResult.error ? 'Sync Failed' : 'Sync Successful'}</p>
            <p className="text-sm">
              {syncResult.error ? syncResult.error : `Successfully synchronized ${syncResult.count} repository connections from GitHub.`}
            </p>
          </div>
        )}

        {/* Debug Alerts */}
        {(success || fail || empty) && (
          <div className={`mb-8 p-4 rounded-lg border-l-4 ${fail || empty ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
            <p className="font-bold">Installation Result</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>✅ Successfully processed: {success || 0}</li>
              {fail && <li className="text-red-600 font-semibold">❌ Failed to store: {fail}</li>}
              {lastError && <li className="text-red-700 italic">Error details: {lastError}</li>}
              {empty && <li className="font-bold">⚠️ GitHub returned NO repositories for this installation ID.</li>}
            </ul>
            <p className="text-xs mt-3 opacity-75">If repositories are missing, please try re-installing or check your GitHub App selection.</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Monitor your deployments and view autonomous fix activity
          </p>
        </div>

        {/* Connected Repositories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Connected Repositories</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                    Syncing...
                  </>
                ) : (
                  <>🔄 Sync Repos</>
                )}
              </button>
              {repos && repos.length > 0 && <RemoveAllReposButton />}
              <Link
                href="/setup/connect-repo"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Connect Repository
              </Link>
            </div>
          </div>

          {repos && repos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {repos.map((repo: any) => {
                // Find latest failure for this repo
                const failure = recentFailures.find((f: any) => 
                  f.vercel_projects?.github_installation_id === repo.id
                );
                
                let status: 'healthy' | 'failed' | 'fixing' | 'action_required' = 'healthy';
                
                if (failure) {
                  if (failure.status === 'pending_analysis' || failure.status === 'fixing') {
                    status = 'fixing';
                  } else if (failure.status === 'failed_after_max_retries') {
                    if (failure.is_fixable === false || failure.user_notified === true) {
                      status = 'action_required';
                    } else {
                      status = 'failed';
                    }
                  }
                }

                return (
                  <RepoCard key={repo.id} repo={repo} status={status} />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No repositories connected yet</p>
              <Link
                href="/setup/connect-repo"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Your First Repository
              </Link>
            </div>
          )}
        </section>

        {/* Recent Failures */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Failures</h2>
            <Link
              href="/failures"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>

          {recentFailures.length > 0 ? (
            <div className="space-y-4">
              {recentFailures.map((failure: any) => (
                <FailureCard key={failure.id} failure={failure} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-gray-600 text-lg">No failures detected!</p>
              <p className="text-gray-500 text-sm mt-2">
                All your deployments are healthy
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}

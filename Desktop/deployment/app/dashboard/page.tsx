import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { RepoCard } from '@/components/RepoCard';
import { FailureCard } from '@/components/FailureCard';
import Link from 'next/link';

async function getRepos() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/repos`, {
      headers: {
        Cookie: `user_id=${userId.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.repos || [];
  } catch (error) {
    console.error('Failed to fetch repos:', error);
    return [];
  }
}

async function getRecentFailures() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/failures`, {
      headers: {
        Cookie: `user_id=${userId.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.failures || []).slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch failures:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    redirect('/');
  }

  const [repos, recentFailures] = await Promise.all([getRepos(), getRecentFailures()]);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link
              href="/setup/connect-repo"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Connect Repository
            </Link>
          </div>

          {repos && repos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {repos.map((repo: any) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
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

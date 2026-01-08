import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { FailureCard } from '@/components/FailureCard';

async function getAllFailures() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    return [];
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/failures`, {
      headers: {
        Cookie: `user_id=${userId.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.failures || [];
  } catch (error) {
    console.error('Failed to fetch failures:', error);
    return [];
  }
}

export default async function FailuresPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (!userId) {
    redirect('/');
  }

  const failures = await getAllFailures();

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Failures</h1>
          <p className="text-gray-600">
            View all deployment failures and autonomous fix attempts
          </p>
        </div>

        {failures.length > 0 ? (
          <div className="space-y-4">
            {failures.map((failure: any) => (
              <FailureCard key={failure.id} failure={failure} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 text-lg">No failures found!</p>
            <p className="text-gray-500 text-sm mt-2">
              All your deployments are running smoothly
            </p>
          </div>
        )}
      </main>
    </>
  );
}

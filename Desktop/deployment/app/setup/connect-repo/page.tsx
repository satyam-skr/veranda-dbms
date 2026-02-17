import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ConnectRepoPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    redirect('/');
  }

  // Pass user_id in 'state' param so it survives the round-trip to GitHub
  // This fixes the issue where cookies are lost during cross-site redirects
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

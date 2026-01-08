'use client';

export default function ConnectRepoPage() {
  const handleConnect = () => {
    // Redirect to GitHub App installation
    // Replace YOUR_GITHUB_APP_NAME with your actual GitHub App name
    const githubAppUrl = 'https://github.com/apps/AutoFix-Arkin26/installations/new';
    window.location.href = githubAppUrl;
  };

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

        <button
          onClick={handleConnect}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Install GitHub App
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          You'll be redirected to GitHub to authorize the installation
        </p>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectVercelPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    githubInstallationId: '',
    projectId: '',
    vercelToken: '',
    deployHookUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/setup/connect-vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect Vercel project');
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Vercel Project</h1>
        <p className="text-gray-600 mb-8">
          Link your Vercel project to enable autonomous deployment monitoring
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Installation ID
            </label>
            <input
              type="text"
              required
              value={formData.githubInstallationId}
              onChange={(e) => setFormData({ ...formData, githubInstallationId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="From your dashboard repos list"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find this in your dashboard under connected repositories
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vercel Project ID
            </label>
            <input
              type="text"
              required
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="prj_..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in Vercel project settings → General → Project ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vercel API Token
            </label>
            <input
              type="password"
              required
              value={formData.vercelToken}
              onChange={(e) => setFormData({ ...formData, vercelToken: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Vercel token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Create at: Settings → Tokens → Create Token (scope: full access)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deploy Hook URL (Optional)
            </label>
            <input
              type="url"
              value={formData.deployHookUrl}
              onChange={(e) => setFormData({ ...formData, deployHookUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.vercel.com/v1/integrations/deploy/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Found in project Settings → Git → Deploy Hooks
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect Vercel Project'}
          </button>
        </form>
      </div>
    </main>
  );
}

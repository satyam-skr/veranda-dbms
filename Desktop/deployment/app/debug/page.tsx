'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientCookies, setClientCookies] = useState('');

  useEffect(() => {
    setClientCookies(document.cookie);

    fetch('/api/debug/cookies')
      .then(res => res.json())
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        setApiData({ error: err.message });
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6">Cookie Debugger</h1>

      <div className="grid gap-8">
        <section className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h2 className="text-lg font-bold mb-2 text-blue-700">Client-Side (Browser)</h2>
          <div className="mb-2">
            <strong>document.cookie:</strong>
            <pre className="mt-1 p-2 bg-white rounded border overflow-x-auto">
              {clientCookies || '(custom empty)'}
            </pre>
          </div>
          <p className="text-gray-600 text-xs">
            Note: HttpOnly cookies (like user_id) will NOT show up here. That is normal.
            But user_id_debug SHOULD show up here if it was set.
          </p>
        </section>

        <section className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h2 className="text-lg font-bold mb-2 text-green-700">Server-Side (API Route Recieved)</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <pre className="p-2 bg-white rounded border overflow-x-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          )}
          <p className="text-gray-600 text-xs mt-2">
            This API endpoint (/api/debug/cookies) echoes back the cookies it received from your browser.
            If 'user_id' is missing here, the browser refused to send it (likely SameSite/Secure mismatch).
          </p>
        </section>
      </div>
    </div>
  );
}

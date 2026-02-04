'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RetryButtonProps {
  failureId: string;
}

export function RetryButton({ failureId }: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRetry = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/manual-retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ failureId }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry');
      }

      const data = await response.json();
      
      if (data.success && data.newFailureId) {
        // Redirect to the new failure record
        router.push(`/failures/${data.newFailureId}`);
      } else {
        // Just refresh if no new ID returned (fallback)
        router.refresh();
      }
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to trigger retry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Starting AutoFix...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry AutoFix
        </>
      )}
    </button>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RemoveAllReposButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/repos', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'All repositories removed successfully!');
        router.refresh();
        setShowConfirm(false);
      } else {
        alert(`Failed to remove repositories: ${data.error}`);
      }
    } catch (error) {
      alert('An error occurred while removing repositories');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        Remove All Repos
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-red-600 font-medium text-sm">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}

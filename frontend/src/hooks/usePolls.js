import { useState, useEffect, useCallback } from 'react';
import { getPolls, getPendingRequests } from '../services/api/polls';

export const usePolls = (userId, isAdmin = false) => {
  const [polls, setPolls] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolls = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const data = await getPolls(userId);
      setPolls(data);
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  const fetchPendingRequests = useCallback(async () => {
    if (!userId || !isAdmin) return;
    try {
      setError(null);
      const data = await getPendingRequests(userId);
      setPendingRequests(data);
    } catch (err) {
      setError(err.message);
    }
  }, [userId, isAdmin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPolls(), fetchPendingRequests()]);
    setLoading(false);
  }, [fetchPolls, fetchPendingRequests]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    polls,
    pendingRequests,
    loading,
    error,
    refresh,
    setPolls,
    setPendingRequests,
  };
};

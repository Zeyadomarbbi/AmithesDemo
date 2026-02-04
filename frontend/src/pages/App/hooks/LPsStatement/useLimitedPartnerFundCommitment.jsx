
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

export const useLimitedPartnerFundCommitment = (fundId) => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     FETCH LIST
     ========================= */
  const fetchCommitments = useCallback(async () => {
    if (!fundId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/fund-commitments/`);
      if (!response.ok) throw new Error('Failed to fetch fund commitments');
      const data = await response.json();
      console.log("💾 HOOK STATE UPDATE: Commitments received from API:", data.length);
      console.log("💾 FIRST ITEM SAMPLE:", data[0])
      setCommitments([...data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  /* =========================
     FETCH DETAIL
     ========================= */
  const fetchCommitmentDetail = async (commitmentId) => {
    if (!fundId || !commitmentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/fund-commitments/${commitmentId}/`
      );
      if (!response.ok) throw new Error('Failed to fetch commitment detail');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CREATE
     ========================= */
  const createCommitment = async (payload) => {
    if (!fundId) throw new Error('Missing fundId');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/fund-commitments/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || JSON.stringify(data));
      }

      setCommitments((prev) => [...prev, { ...data }]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UPDATE (PUT / PATCH)
     ========================= */
  const updateCommitment = async (commitmentId, payload, partial = true) => {
    if (!fundId || !commitmentId) throw new Error('Missing identifiers');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/fund-commitments/${commitmentId}/`,
        {
          method: partial ? 'PATCH' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || JSON.stringify(data));
      }

      setCommitments(prev =>
        prev.map(c =>
            c.commitment_id === commitmentId ? { ...data } : c
        )
      );

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE
     ========================= */
  const deleteCommitment = async (commitmentId) => {
    if (!fundId || !commitmentId) throw new Error('Missing identifiers');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/fund-commitments/${commitmentId}/`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete commitment');

      setCommitments((prev) =>
        prev.filter((c) => c.commitment_id !== commitmentId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    commitments,
    loading,
    error,
    fetchCommitments,
    fetchCommitmentDetail,
    createCommitment,
    updateCommitment,
    deleteCommitment,
  };
};
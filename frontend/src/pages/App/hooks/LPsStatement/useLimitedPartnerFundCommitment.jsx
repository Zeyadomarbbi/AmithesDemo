import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export const useLimitedPartnerFundCommitment = (fundId) => {
  const api = useApi();
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
      const data = await api.get(`/api/funds/${fundId}/fund-commitments/`);
      setCommitments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, api]);

  /* =========================
      FETCH DETAIL
     ========================= */
  const fetchCommitmentDetail = async (commitmentId) => {
    if (!fundId || !commitmentId) return;

    setLoading(true);
    setError(null);

    try {
      return await api.get(`/api/funds/${fundId}/fund-commitments/${commitmentId}/`);
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
      const data = await api.post(`/api/funds/${fundId}/fund-commitments/`, payload);
      setCommitments((prev) => [...prev, data]);
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
      const method = partial ? 'patch' : 'put';
      const data = await api[method](`/api/funds/${fundId}/fund-commitments/${commitmentId}/`, payload);

      setCommitments(prev =>
        prev.map(c => c.commitment_id === commitmentId ? data : c)
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
      await api.delete(`/api/funds/${fundId}/fund-commitments/${commitmentId}/`);
      setCommitments((prev) => prev.filter((c) => c.commitment_id !== commitmentId));
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
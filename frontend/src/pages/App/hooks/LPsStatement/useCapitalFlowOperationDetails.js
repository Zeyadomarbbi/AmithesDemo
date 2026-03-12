import { useState, useCallback } from 'react';
import useApi from '../../../../hooks/api/useApi';

export function useOperationDetails(fundId) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const api = useApi();

  // Helper to generate relative endpoint paths
  const getEndpoint = useCallback((operationId = null) => {
    const base = `/api/funds/${fundId}/operations/`;
    return operationId ? `${base}${operationId}/` : base;
  }, [fundId]);

  // ── LIST ──────────────────────────────────────────────────────────────────
  const fetchOperations = useCallback(async () => {
    if (!fundId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(getEndpoint());
      setOperations(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [api, fundId, getEndpoint]);

  // ── RETRIEVE ──────────────────────────────────────────────────────────────
  const fetchOperation = useCallback(async (operationId) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    return await api.get(getEndpoint(operationId));
  }, [api, fundId, getEndpoint]);

  // ── CREATE ────────────────────────────────────────────────────────────────
  const createOperation = useCallback(async (payload) => {
    if (!fundId) throw new Error('fundId is missing.');
    setError(null);
    const data = await api.post(getEndpoint(), {
      fund: Number(fundId),
      fund_id: Number(fundId),
      ...payload,
    });
    
    const newId = data?.lps_operation_details_id ?? data?.operation_id ?? data?.id ?? null;
    if (!newId) throw new Error('Create succeeded but response missing operation id.');
    return newId;
  }, [api, fundId, getEndpoint]);

  // ── FULL UPDATE (PUT) ─────────────────────────────────────────────────────
  const updateOperation = useCallback(async (operationId, payload) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    setError(null);
    return await api.put(getEndpoint(operationId), {
      fund: Number(fundId),
      fund_id: Number(fundId),
      ...payload,
    });
  }, [api, fundId, getEndpoint]);

  // ── DELETE ────────────────────────────────────────────────────────────────
  const deleteOperation = useCallback(async (operationId) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    setError(null);
    await api.delete(getEndpoint(operationId));
    setOperations((prev) =>
      prev.filter((op) => (op?.lps_operation_details_id ?? op?.id) !== operationId)
    );
  }, [api, fundId, getEndpoint]);

  return {
    operations,
    loading,
    error,
    fetchOperations,
    fetchOperation,
    createOperation,
    updateOperation,
    deleteOperation,
  };
}
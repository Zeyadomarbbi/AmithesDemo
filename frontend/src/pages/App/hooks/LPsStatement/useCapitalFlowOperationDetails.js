import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

function apiUrl(fundId, operationId = null) {
  const base = `${API_BASE_URL}/api/funds/${fundId}/operations/`;
  return operationId ? `${base}${operationId}/` : base;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    if (data && typeof data === 'object') msg = JSON.stringify(data);
    else if (typeof data === 'string' && data.trim()) msg = data;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * useOperationDetails
 *
 * CRUD for lps_operation_details scoped to a fund.
 *
 * Save strategy:
 *   State accumulates across Steps 1–3 in OperationPanel.
 *   A single createOperation() POST fires at the final step
 *   with the full assembled payload:
 *     operation_name, operation_type, notice_date_id, due_date_id,
 *     total_fund_commitment,             <- computed at Step 1
 *     total_operation_amount,            <- collected at Step 3
 *     overall_percentage_of_commitment   <- collected at Step 3
 */
export function useOperationDetails(fundId) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── LIST ──────────────────────────────────────────────────────────────────
  const fetchOperations = useCallback(async () => {
    if (!fundId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(apiUrl(fundId));
      setOperations(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  // ── RETRIEVE ──────────────────────────────────────────────────────────────
  const fetchOperation = useCallback(async (operationId) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    const data = await fetchJson(apiUrl(fundId, operationId));
    return data;
  }, [fundId]);

  // ── CREATE ────────────────────────────────────────────────────────────────
  /**
   * Single POST with full payload assembled from all steps.
   * @returns {number} lps_operation_details_id
   */
  const createOperation = useCallback(async (payload) => {
    if (!fundId) throw new Error('fundId is missing.');
    setError(null);
    const data = await fetchJson(apiUrl(fundId), {
      method: 'POST',
      body: JSON.stringify({
        fund: Number(fundId),
        fund_id: Number(fundId),
        ...payload,
      }),
    });
    const newId = data?.lps_operation_details_id ?? data?.operation_id ?? data?.id ?? null;
    if (!newId) throw new Error('Create succeeded but response missing operation id.');
    return newId;
  }, [fundId]);

  // ── FULL UPDATE (PUT) ─────────────────────────────────────────────────────
  const updateOperation = useCallback(async (operationId, payload) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    setError(null);
    const data = await fetchJson(apiUrl(fundId, operationId), {
      method: 'PUT',
      body: JSON.stringify({
        fund: Number(fundId),
        fund_id: Number(fundId),
        ...payload,
      }),
    });
    return data;
  }, [fundId]);

  // ── DELETE ────────────────────────────────────────────────────────────────
  const deleteOperation = useCallback(async (operationId) => {
    if (!fundId) throw new Error('fundId is missing.');
    if (!operationId) throw new Error('operationId is missing.');
    setError(null);
    await fetchJson(apiUrl(fundId, operationId), { method: 'DELETE' });
    setOperations((prev) =>
      prev.filter((op) => (op?.lps_operation_details_id ?? op?.id) !== operationId)
    );
  }, [fundId]);

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
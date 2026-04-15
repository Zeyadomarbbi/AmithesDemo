import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

export const usePortfolioFlows = (fundId, investmentId) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [flows, setFlows] = useState([]);
  const [fairValues, setFairValues] = useState([]);

  const fetchFlows = useCallback(async (scenarioId = null) => {
    if (!investmentId) return;
    setLoading(true);
    try {
      const endpoint = scenarioId
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
        : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
      const data = toSafeArray(await api.get(endpoint));
      setFlows([...data].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      console.error("Failed to fetch flows:", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, investmentId, api]);

  const createFlow = async (scenarioId = null, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
    try {
      const data = await api.post(endpoint, { ...payload, scenario_id: scenarioId });
      fetchFlows(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow creation failed:", err.message);
      throw err;
    }
  };

  const deleteFlow = async (scenarioId = null, flowId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      await api.delete(endpoint);
      fetchFlows(scenarioId);
    } catch (err) {
      console.error("Flow deletion failed:", err.message);
    }
  };

  const updateFlow = async (scenarioId = null, flowId, payload) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/flows/${flowId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${flowId}/`;
    try {
      const data = await api.patch(endpoint, payload);
      fetchFlows(scenarioId);
      return data;
    } catch (err) {
      console.error("Flow update failed:", err.message);
      throw err;
    }
  };

  // --- FAIR VALUES ---

  const fetchFairValues = useCallback(async (scenarioId = null) => {
    if (!investmentId) return;
    setLoading(true);
    try {
      const endpoint = scenarioId
        ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/fair-values/`
        : `/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`;
      const data = toSafeArray(await api.get(endpoint));
      setFairValues([...data].sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      console.error("Failed to fetch fair values:", err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, investmentId, api]);

  const saveFairValue = async (scenarioId = null, payload) => {
    const existingId = payload.fairValueId ?? payload.id ?? null;
    const base = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/fair-values/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`;
    const endpoint = existingId ? `${base}${existingId}/` : base;
    try {
      const data = existingId
        ? await api.put(endpoint, payload)
        : await api.post(endpoint, { ...payload, scenario_id: scenarioId });
      fetchFairValues(scenarioId);
      return data;
    } catch (err) {
      console.error("Fair value save failed:", err.message);
      throw err;
    }
  };

  const deleteFairValue = async (scenarioId = null, fairValueId) => {
    const endpoint = scenarioId
      ? `/api/funds/${fundId}/scenario_list/${scenarioId}/portfolio-investments/${investmentId}/fair-values/${fairValueId}/`
      : `/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/${fairValueId}/`;
    try {
      await api.delete(endpoint);
      fetchFairValues(scenarioId);
    } catch (err) {
      console.error("Fair value deletion failed:", err.message);
    }
  };

  return {
    flows,
    fairValues,
    loading,
    fetchFlows,
    createFlow,
    updateFlow,
    deleteFlow,
    fetchFairValues,
    saveFairValue,
    deleteFairValue,
  };
};
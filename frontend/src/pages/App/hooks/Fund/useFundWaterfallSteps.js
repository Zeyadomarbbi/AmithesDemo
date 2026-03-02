import { useState, useCallback } from "react";
import useApi from "../api/useApi";

export function useFundWaterfallSteps() {
  const api = useApi();
  const [loading, setLoading] = useState({
    fetch: false,
    save: false,
    delete: false,
  });

  const [error, setError] = useState(null);

  const setLoadingState = (key, value) =>
    setLoading(prev => ({ ...prev, [key]: value }));

  /**
   * Transforms the UI payload to match Django Serializer expectations.
   * Note: useApi handles JSON.stringify, so we return a clean object here.
   */
  const preparePayload = (payload) => {
    // Convert empty strings to null for Decimal compatibility
    const clean = JSON.parse(
      JSON.stringify(payload, (key, value) => (value === "" ? null : value))
    );

    const ensureArray = (data) => (Array.isArray(data) ? data : Object.values(data || {}));

    return {
      ...clean,
      rules: ensureArray(clean.rules),
      envelopes: (clean.envelopes || []).map(env => ({
        ...env,
        rules: ensureArray(env.rules)
      }))
    };
  };

  const fetchFundSteps = useCallback(async (fundId) => {
    setLoadingState("fetch", true);
    setError(null);
    try {
      return await api.get(`/api/funds/${fundId}/waterfall-steps/`);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingState("fetch", false);
    }
  }, [api]);

  const createStep = async (fundId, payload) => {
    setLoadingState("save", true);
    setError(null);
    try {
      const processedPayload = preparePayload(payload);
      return await api.post(`/api/funds/${fundId}/waterfall-steps/`, processedPayload);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingState("save", false);
    }
  };

  const updateStep = async (fundId, stepId, payload) => {
    setLoadingState("save", true);
    setError(null);
    try {
      const processedPayload = preparePayload(payload);
      return await api.put(`/api/funds/${fundId}/waterfall-steps/${stepId}/`, processedPayload);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingState("save", false);
    }
  };

  const deleteStep = async (fundId, stepId) => {
    setLoadingState("delete", true);
    setError(null);
    try {
      await api.delete(`/api/funds/${fundId}/waterfall-steps/${stepId}/`);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingState("delete", false);
    }
  };

  return {
    fetchFundSteps,
    createStep,
    updateStep,
    deleteStep,
    loading,
    error,
  };
}
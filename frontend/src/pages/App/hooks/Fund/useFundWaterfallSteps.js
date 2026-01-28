import { useState, useCallback } from "react";
import { API_BASE_URL } from "../useApi";

export function useFundWaterfallSteps() {
  const [loading, setLoading] = useState({
    fetch: false,
    save: false,
    delete: false,
  });

  const [error, setError] = useState(null);

  const setLoadingState = (key, value) =>
    setLoading(prev => ({ ...prev, [key]: value }));

  /**
   * Transforms the UI payload to match Django Serializer expectations:
   * 1. Converts empty strings to null for Decimal compatibility.
   * 2. Converts Rules Dictionaries (keyed by ID) back into Arrays.
   */
  const preparePayload = (payload) => {
    const stringified = JSON.stringify(payload, (key, value) => 
      value === "" ? null : value
    );
    const clean = JSON.parse(stringified);

    // Helper to ensure rules are always sent as an array
    const ensureArray = (data) => (Array.isArray(data) ? data : Object.values(data || {}));

    return {
      ...clean,
      // Handle Step-level rules
      rules: ensureArray(clean.rules),
      // Handle Envelope-level rules
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
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/`);
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoadingState("fetch", false);
    }
  }, []);

  const createStep = async (fundId, payload) => {
    setLoadingState("save", true);
    setError(null);
    try {
      const processedPayload = preparePayload(payload);
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedPayload),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
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
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/${stepId}/`, {
        method: "PUT", // Or PATCH if your APIView supports partial updates
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedPayload),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
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
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/${stepId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw await res.json();
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
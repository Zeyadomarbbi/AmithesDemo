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

  // Helper to convert "" to null for Decimal compatibility
  const sanitizePayload = (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      value === "" ? null : value
    ));
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
      const cleanPayload = sanitizePayload(payload);
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPayload),
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
      const cleanPayload = sanitizePayload(payload);
      const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/waterfall-steps/${stepId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPayload),
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
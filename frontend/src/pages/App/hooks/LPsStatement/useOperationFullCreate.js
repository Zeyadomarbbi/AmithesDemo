import { useCallback, useState } from "react";
import useApi from "../api/useApi";

export function useOperationFullCreate() {
  const api = useApi();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Executes a full operation creation (likely atomic creation of 
   * Operation + associated LP distributions/calls).
   */
  const createFullOperation = useCallback(async (fundId, payload) => {
    if (!fundId) throw new Error("Missing fundId");
    if (!payload) throw new Error("Missing payload");

    setIsSaving(true);
    setError(null);

    try {
      // api.post handles API_BASE, JSON stringification, and credentials: "include"
      const data = await api.post(
        `/api/lps-statement/funds/${fundId}/operations/full-create/`,
        payload
      );

      return data;
    } catch (e) {
      setError(e.message || e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [api]);

  return {
    createFullOperation,
    isSaving,
    error,
  };
}
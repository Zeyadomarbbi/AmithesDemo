import { useCallback, useState } from "react";
import useApi from "../api/useApi";

export function useFlowTypes() {
  const api = useApi();
  const [flowTypes, setFlowTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlowTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // useApi prepends the correct base/prefix and handles credentials: "include"
      const data = await api.get("/api/flow-types/");

      // Handle both direct arrays and paginated DRF responses
      const list = Array.isArray(data) ? data : data?.results || [];
      setFlowTypes(list);
      return list;
    } catch (e) {
      setError(e.message || e);
      setFlowTypes([]);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  return { flowTypes, fetchFlowTypes, isLoading, error };
}
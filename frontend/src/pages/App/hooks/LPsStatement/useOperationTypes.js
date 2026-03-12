import { useCallback, useState } from "react";
import useApi from "../../../../hooks/api/useApi";

export function useOperationTypes() {
  const api = useApi();
  const [operationTypes, setOperationTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOperationTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // useApi prepends the correct base URL/prefix and handles credentials
      const data = await api.get("/api/operation-types/");

      // Support both direct arrays and paginated DRF results
      const list = Array.isArray(data) ? data : data?.results || [];
      setOperationTypes(list);
      
      return list;
    } catch (e) {
      setError(e.message || e);
      setOperationTypes([]);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  return { operationTypes, fetchOperationTypes, isLoading, error };
}
import { useState, useEffect, useCallback } from "react";
import useApi from "./api/useApi";

export function useShareClasses(fundId) {
  const api = useApi();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!fundId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get(`/api/funds/${fundId}/share-classes/`);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [fundId, api]);

  const create = async (payload) => {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    // useApi automatically detects FormData and omits Content-Type header
    await api.post(`/api/funds/${fundId}/share-classes/`, formData);
    await fetchAll();
  };

  const update = async (id, payload) => {
    // Standard JSON update
    await api.put(`/api/funds/${fundId}/share-classes/${id}/`, payload);
    await fetchAll();
  };

  const remove = async (id) => {
    await api.delete(`/api/funds/${fundId}/share-classes/${id}/`);
    await fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
}
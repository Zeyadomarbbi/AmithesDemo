import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export const useFundClosings = (fundId = null) => {
  const api = useApi();
  const [fundClosings, setFundClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFundClosings = useCallback(async () => {
    if (!fundId) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/funds/${fundId}/fund-closings/`);
      setFundClosings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId, api]);

  const createFundClosing = async (closingData) => {
    if (!fundId) throw new Error("Missing Fund ID for creation");
    setLoading(true);
    setError(null);
    try {
      const resData = await api.post(`/api/funds/${fundId}/fund-closings/`, closingData);
      setFundClosings((prev) => [...prev, resData]);
      return resData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchFundClosingDetail = async (recordId) => {
    if (!fundId) return;
    setLoading(true);
    try {
      return await api.get(`/api/funds/${fundId}/fund-closings/${recordId}/`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    fundClosings,
    loading,
    error,
    fetchFundClosings,
    createFundClosing,
    fetchFundClosingDetail,
  };
};
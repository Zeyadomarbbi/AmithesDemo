import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export const useFundClosings = (fundId = null) => {
  const api = useApi();
  const [closingPeriods, setClosingPeriods] = useState([]);
  const [fundClosings, setFundClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Generic Fetch (No fundId needed)
  const fetchClosingPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/closing-periods/');
      setClosingPeriods(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // 2. Fund Specific: Fetch List
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

  // 3. Fund Specific: Create
  const createFundClosing = async (closingData) => {
    if (!fundId) throw new Error("Missing Fund ID for creation");
    console.log("Creating fund closing with data:", closingData);
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

  // 4. Fund Specific: Detail
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
    closingPeriods,
    fundClosings,
    loading,
    error,
    fetchClosingPeriods,
    fetchFundClosings,
    createFundClosing,
    fetchFundClosingDetail
  };
};
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

export const useFundClosings = (fundId = null) => {
  const [closingPeriods, setClosingPeriods] = useState([]);
  const [fundClosings, setFundClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Generic Fetch (No fundId needed)
  const fetchClosingPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/closing-periods/`);
      if (!response.ok) throw new Error('Failed to fetch closing periods');
      const data = await response.json();
      setClosingPeriods(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fund Specific: Fetch List
  const fetchFundClosings = useCallback(async () => {
    if (!fundId) return; // Silent return if fundId isn't available yet
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/fund-closings/`);
      if (!response.ok) throw new Error('Failed to fetch fund closings');
      const data = await response.json();
      setFundClosings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  // 3. Fund Specific: Create
  const createFundClosing = async (closingData) => {
    if (!fundId) throw new Error("Missing Fund ID for creation");
    
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/fund-closings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closingData), // Payload now includes the integer fund ID
      });
      const resData = await response.json();
      if (!response.ok) {
        const serverError = resData.detail || JSON.stringify(resData)
        throw new Error(serverError);
      }

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
      const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/fund-closings/${recordId}/`);
      if (!response.ok) throw new Error('Failed to fetch record detail');
      return await response.json();
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
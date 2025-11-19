import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function useActiveFund() {
  const { fundId } = useParams();

  // 1. If we have a fundId in the URL, save it to LocalStorage
  useEffect(() => {
    if (fundId) {
      localStorage.setItem('lastActiveFundId', fundId);
    }
  }, [fundId]);

  // 2. Return the URL id if it exists, otherwise get the saved one, otherwise default to "1"
  // This ensures we never return "undefined"
  const savedId = localStorage.getItem('lastActiveFundId');
  return fundId || savedId || "1";
}
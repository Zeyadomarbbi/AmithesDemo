import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function useActiveFund() {
  const { fundId } = useParams();

  // We still save the ID to localStorage when the user is actually IN a fund
  useEffect(() => {
    if (fundId) {
      localStorage.setItem('lastActiveFundId', fundId);
    }
  }, [fundId]);

  // Return ONLY the URL fundId. 
  // This allows the SidePanel to know when to hide the menu.
  return fundId;
}
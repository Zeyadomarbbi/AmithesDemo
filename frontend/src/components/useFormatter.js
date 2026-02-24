import { useCallback } from 'react';

export const useNumberFormatter = () => {
  const formatNumber = useCallback((value) => {
    const num = parseFloat(value || 0);
    
    // Check for NaN if the input string is not a valid number
    if (isNaN(num)) return '0.00';

    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, []);

  return formatNumber;
};

export const usePercentageFormatter = () => {
  const formatPercentage = useCallback((value) => {
    const num = parseFloat(value || 0);

    if (isNaN(num)) return '0.00%';

    return `${num.toFixed(2)}%`;
  }, []);

  return formatPercentage;
};

export const useDateFormatter = () => {
  /** DD/MM/YYYY */
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '-';

    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }, []);

  return formatDate;
};
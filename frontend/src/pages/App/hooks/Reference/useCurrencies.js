import { useFundData } from '../Core/FundContext';

export function useCurrencies() {
  const { currencies, currenciesLoading } = useFundData();
  return { currencies, isLoading: currenciesLoading };
}
import { useFundData } from '../Core/FundContext';

export function useCountries() {
  const { countries, countriesLoading } = useFundData();
  return { countries, isLoading: countriesLoading };
}
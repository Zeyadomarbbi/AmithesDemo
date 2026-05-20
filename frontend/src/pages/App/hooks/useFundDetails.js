import { useMemo } from "react";
import { useFundData } from "./Core/FundContext";

export function useFundDetails(fundId) {
  const { funds, isLoading, error, refetch } = useFundData();

  const fund = useMemo(
    () => funds.find(f => f.id === fundId) || null,
    [funds, fundId]
  );

  return { fund, isLoading, error, refetch };
}
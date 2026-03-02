import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import useApi from "../../../../hooks/api/useApi"; // Import the new centralized hook

const FundContext = createContext(null);

export function FundProvider({ children }) {
  const api = useApi(); // Initialize the API engine
  const [funds, setFunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFundId, setActiveFundId] = useState(() => localStorage.getItem('lastActiveFundId'));

  // --- DATA NORMALIZER ---
  const formatFund = useCallback((f) => ({
    id: f.fund_id,
    name: f.legal_name,
    shortName: f.short_name,
    formationDate: f.formation_date,
    currencyId: f.currency_id,
    legalForm: f.legal_form ?? "",
    manCo: f.management_company ?? "",
    strategy: f.fund_strategy ?? "",
    phaseName: f.phase_name,
    createdAt: f.created_at,
    updatedAt: f.updated_at ?? null,
    isDeleted: f.is_deleted,
    isSetupComplete: f.is_setup_complete ?? false, 
  }), []);

  // --- ACTIONS ---
  const refreshFunds = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use new api.get - API_BASE_URL is handled internally by useApi
      const data = await api.get("/api/funds/");
      setFunds(data.filter(f => !f.is_deleted).map(formatFund));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, formatFund]);

  const initializeFund = async (payload) => {
    try {
      const data = await api.post("/api/funds/", {
        legal_name: payload.legalName,
        short_name: payload.shortName,
        formation_date: payload.formationDate,
        currency_id: payload.currency_id,
        phase_name: payload.phaseName || "Marketing", 
        legal_form: payload.legalForm || "",
        management_company: payload.manCo || "",
        fund_strategy: payload.strategy || "",
      });
      
      const newFund = formatFund(data);
      setFunds((prev) => [newFund, ...prev]);
      return { success: true, id: newFund.id }; 
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateFund = async (id, payload) => {
    try {
      const data = await api.put(`/api/funds/${id}/`, {
        legal_name: payload.legal_name,
        short_name: payload.short_name,
        formation_date: payload.formation_date,
        currency_id: payload.currency_id,
        phase_name: payload.phase_name,
        legal_form: payload.legal_form,
        management_company: payload.management_company,
        fund_strategy: payload.fund_strategy,
      });
      const formatted = formatFund(data);
      setFunds((prev) => prev.map((f) => (f.id === id ? formatted : f)));
      return { success: true, data: formatted };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteFund = async (id) => {
    try {
      await api.delete(`/api/funds/${id}/`);
      setFunds((prev) => prev.filter((f) => f.id !== id));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  useEffect(() => {
    refreshFunds();
  }, [refreshFunds]);

  return (
    <FundContext.Provider 
      value={{ 
        funds, 
        isLoading, 
        error, 
        activeFundId,
        setActiveFundId,
        refreshFunds, 
        initializeFund, 
        updateFund, 
        deleteFund, 
        formatFund,
        api // Passing the new api object down
      }}
    >
      {children}
    </FundContext.Provider>
  );
}

// --- HOOKS ---
export function useFundData() {
  const ctx = useContext(FundContext);
  if (!ctx) throw new Error("useFundData must be used within FundProvider");
  return ctx;
}

export function useFundDetails(fundId) {
  const { formatFund, api } = useFundData();
  const [fund, setFund] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/funds/${fundId}/`);
      setFund(formatFund(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fundId, formatFund, api]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { fund, isLoading, error, refetch: fetchDetail };
}
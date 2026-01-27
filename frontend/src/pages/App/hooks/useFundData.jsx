import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "./useApi";

const FundContext = createContext(null);

export function FundProvider({ children }) {
  const [funds, setFunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const formatFund = (f) => ({
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
  });

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/funds/`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        // Only display records where is_deleted is false
        setFunds(data.filter(f => !f.is_deleted).map(formatFund));
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFunds();
  }, []);

  const initializeFund = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/funds/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: payload.name,
          short_name: payload.shortName,
          formation_date: payload.formationDate,
          currency_id: payload.currencyId,
          phase_name: payload.phaseName,
          legal_form: payload.legalForm,
          management_company: payload.manCo,
          fund_strategy: payload.strategy,
        }),
      });
      if (!res.ok) throw new Error("Fund creation failed");
      const saved = await res.json();
      setFunds((prev) => [formatFund(saved), ...prev]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateFund = async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/funds/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: payload.name,
          short_name: payload.shortName,
          formation_date: payload.formationDate,
          currency_id: payload.currencyId,
          phase_name: payload.phaseName,
          legal_form: payload.legalForm,
          management_company: payload.manCo,
          fund_strategy: payload.strategy,
        }),
      });
      if (!res.ok) throw new Error("Fund update failed");
      const updated = await res.json();
      setFunds((prev) => prev.map((f) => (f.id === id ? formatFund(updated) : f)));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteFund = async (id) => {
    try {
      // Endpoint handles is_deleted = TRUE logic
      const res = await fetch(`${API_BASE_URL}/api/funds/${id}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Delete operation failed");
      }

      // Remove from local state immediately
      setFunds((prev) => prev.filter((f) => f.id !== id));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <FundContext.Provider 
      value={{ 
        funds, 
        isLoading, 
        error, 
        initializeFund, 
        updateFund, 
        deleteFund 
      }}
    >
      {children}
    </FundContext.Provider>
  );
}

export function useFundData() {
  const ctx = useContext(FundContext);
  if (!ctx) throw new Error("useFundData must be used within FundProvider");
  return ctx;
}
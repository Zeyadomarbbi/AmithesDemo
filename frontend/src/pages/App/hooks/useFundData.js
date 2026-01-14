import { useState, useEffect } from 'react';

export function useFundData() {
    const [funds, setFunds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFunds = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("http://127.0.0.1:8000/api/funds/");
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // Map ALL backend fields to frontend structure
                const formattedFunds = data.map(f => ({
                    // --- Identifiers & Timestamps ---
                    id: f.fund_id,
                    created_at: f.created_at,
                    updated_at: f.updated_at,

                    // --- Core Fields ---
                    name: f.legal_name,
                    shortName: f.short_name,
                    legalForm: f.legal_form,
                    manCo: f.management_company || "",
                    strategy: f.fund_strategy || "",

                    // --- Related Data (IDs & Strings) ---
                    formationDate: f.formation_date_string, // "14/01/2026"
                    formationDateId: f.formation_date,      // 20260114
                    
                    currencyId: f.currency,                 // ID
                    currencyName: f.currency_name,          // "Euro"
                    currencySymbol: f.currency_symbol,      // "€"
                    
                    phaseId: f.phase,                       // ID
                    badgeText: f.phase_name || "–",         // "Investment Period"

                    // --- KPI Placeholders (To be fetched separately via /api/funds/:id/kpis/) ---
                    grossIrr: "–",
                    netIrr: "–",
                    dpi: "–",
                    rvpi: "–",
                    tvpi: "–",
                    deals: "–"
                }));

                setFunds(formattedFunds);
            } catch (err) {
                console.error("Fund fetch failed:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFunds();
    }, []);

    const initializeFund = async (payload) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/funds/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    legal_name: payload.legalName,
                    short_name: payload.shortName,
                    formation_date_string: payload.formationDate,
                    currency_id: payload.currency_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to initialize fund");
            }

            const savedFund = await response.json();

            // Match the structure used in fetchFunds
            const formatted = {
                id: savedFund.fund_id,
                created_at: savedFund.created_at,
                updated_at: savedFund.updated_at,
                
                name: savedFund.legal_name,
                shortName: savedFund.short_name,
                legalForm: savedFund.legal_form || "",
                manCo: savedFund.management_company || "",
                strategy: savedFund.fund_strategy || "",
                
                formationDate: savedFund.formation_date_string,
                formationDateId: savedFund.formation_date,
                
                currencyId: savedFund.currency,
                currencyName: savedFund.currency_name,
                currencySymbol: savedFund.currency_symbol,
                
                phaseId: savedFund.phase,
                badgeText: savedFund.phase_name || "–",

                // KPI Placeholders
                grossIrr: "–",
                netIrr: "–",
                dpi: "–",
                rvpi: "–",
                tvpi: "–",
                deals: "–"
            };

            setFunds((prev) => [formatted, ...prev]);
            return { success: true };
        } catch (err) {
            console.error("Fund creation failed:", err);
            return { success: false, error: err.message };
        }
    };

    return { funds, setFunds, isLoading, error, initializeFund };
}
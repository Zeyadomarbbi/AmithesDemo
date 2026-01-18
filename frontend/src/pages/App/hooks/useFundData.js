import { useState, useEffect } from 'react';

export function useFundData() {
    const [funds, setFunds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FETCH FUNDS ---
    useEffect(() => {
        const fetchFunds = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("http://127.0.0.1:8000/api/funds/");
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                const formattedFunds = data.map(f => formatFund(f));

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

    // --- HELPER: FORMAT BACKEND DATA TO FRONTEND STRUCTURE ---
    const formatFund = (f) => ({
        id: f.fund_id,
        created_at: f.created_at,
        updated_at: f.updated_at,
        name: f.legal_name,
        shortName: f.short_name,
        legalForm: f.legal_form || "",
        manCo: f.management_company || "",
        strategy: f.fund_strategy || "",
        formationDate: f.formation_date_string,
        formationDateId: f.formation_date,
        currencyId: f.currency,
        currencyName: f.currency_name,
        currencySymbol: f.currency_symbol,
        phaseId: f.phase,
        badgeText: f.phase_name || "–",
        grossIrr: "–", netIrr: "–", dpi: "–", rvpi: "–", tvpi: "–", deals: "–"
    });

    // --- CREATE FUND ---
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
            const formatted = formatFund(savedFund);

            setFunds((prev) => [formatted, ...prev]);
            return { success: true };
        } catch (err) {
            console.error("Fund creation failed:", err);
            return { success: false, error: err.message };
        }
    };

    // --- NEW: UPDATE FUND ---
    const updateFund = async (id, payload) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/funds/${id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), // Maps snake_case keys from the component
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update fund");
            }

            const updatedBackendFund = await response.json();
            const formatted = formatFund(updatedBackendFund);

            // Update local state by replacing the specific fund in the array
            setFunds((prev) => 
                prev.map((fund) => (fund.id === id ? formatted : fund))
            );

            return { success: true, data: formatted };
        } catch (err) {
            console.error("Fund update failed:", err);
            return { success: false, error: err.message };
        }
    };

    return { funds, setFunds, isLoading, error, initializeFund, updateFund };
}
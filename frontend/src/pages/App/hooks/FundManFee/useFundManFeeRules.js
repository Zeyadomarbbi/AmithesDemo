// frontend/src/hooks/FundManFee/useFundManFeeRules.js
import { useState, useCallback } from "react";
import { API_BASE_URL } from '../useApi';

export function useFundManagementFeeRules() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. GET: Fetch existing rules to populate form
    const fetchRules = useCallback(async (fundId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/management-fee-rules/`);
            if (!response.ok) throw new Error("Failed to fetch fee rules");
            return await response.json();
        } catch (err) {
            console.error(err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. POST: Create new rule
    const createRule = async ({ fundId, phaseId, shareClassId, dateFrom, dateUntil, ratePercentage }) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/management-fee-rules/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase: phaseId,
                    share_class: shareClassId,
                    date_from: dateFrom,
                    date_until: dateUntil,
                    rate_percentage: ratePercentage,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }
            return await response.json();
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // 3. PUT: Update existing rule
    const updateRule = async (ruleId, { fundId, phaseId, shareClassId, dateFrom, dateUntil, ratePercentage }) => {
        setIsLoading(true);
        try {
            // Hitting your new endpoint: /management-fee-rules/<int:fee_rule_id>/
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/management-fee-rules/${ruleId}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase: phaseId,
                    share_class: shareClassId,
                    date_from: dateFrom,
                    date_until: dateUntil,
                    rate_percentage: ratePercentage,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }
            return await response.json();
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchRules, createRule, updateRule, isLoading, error };
}
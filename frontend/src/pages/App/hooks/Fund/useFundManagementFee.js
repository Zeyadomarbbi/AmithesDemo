// frontend/src/hooks/useFundManagementFee.js
import { useState, useCallback, useEffect } from "react";
import { API_BASE_URL } from '../useApi';

export function useFundManagementFeeRules() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRules = useCallback(async (fundId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/man-fees-rules/`);
            if (!response.ok) throw new Error("Failed to fetch fee rules");
            return await response.json();
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createRule = async (fundId, payload) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/man-fees-rules/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw errData; // Throw the actual error object for the component to handle
            }
            return await response.json();
        } finally {
            setIsLoading(false);
        }
    };

    const updateRule = async (fundId, ruleId, payload) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/man-fees-rules/${ruleId}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw errData;
            }
            return await response.json();
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRule = async (fundId, ruleId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/man-fees-rules/${ruleId}/`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete rule");
            return true;
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchRules, createRule, updateRule, deleteRule, isLoading, error };
}


export function useManagementFeePhases() {
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/api/man-fee-phases/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch management fee phases");
                }

                const data = await response.json();
                setPhases(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPhases();
    }, []);

    return {
        phases,
        isLoading,
        error,
    };
}
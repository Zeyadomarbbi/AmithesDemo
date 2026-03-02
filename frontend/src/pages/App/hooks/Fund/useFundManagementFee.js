import { useState, useCallback, useEffect } from "react";
import useApi from "../api/useApi";

export function useFundManagementFeeRules() {
    const api = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRules = useCallback(async (fundId) => {
        setIsLoading(true);
        try {
            const data = await api.get(`/api/funds/${fundId}/man-fees-rules/`);
            return data;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    const createRule = async (fundId, payload) => {
        setIsLoading(true);
        try {
            const data = await api.post(`/api/funds/${fundId}/man-fees-rules/`, payload);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateRule = async (fundId, ruleId, payload) => {
        setIsLoading(true);
        try {
            const data = await api.put(`/api/funds/${fundId}/man-fees-rules/${ruleId}/`, payload);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRule = async (fundId, ruleId) => {
        setIsLoading(true);
        try {
            await api.delete(`/api/funds/${fundId}/man-fees-rules/${ruleId}/`);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchRules, createRule, updateRule, deleteRule, isLoading, error };
}

export function useManagementFeePhases() {
    const api = useApi();
    const [phases, setPhases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPhases = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.get("/api/man-fee-phases/");
                setPhases(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPhases();
    }, [api]);

    return {
        phases,
        isLoading,
        error,
    };
}
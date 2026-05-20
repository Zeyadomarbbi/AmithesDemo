import { useState, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export function useLimitedPartners() {
    const api = useApi();
    const [limitedPartners, setLimitedPartners] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLimitedPartners = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // api.get handles the API_BASE_URL and credentials internally
            const data = await api.get('/api/limited-partners/');
            setLimitedPartners([...data]);
        } catch (err) {
            setError(err.message || err);
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    const createLimitedPartner = useCallback(async (payload) => {
        setError(null);
        try {
            const data = await api.post('/api/limited-partners/', payload);
            setLimitedPartners(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error(err);
            throw new Error(err.message || 'Create failed');
        }
    }, [api]);

    const updateLimitedPartner = useCallback(async (id, payload) => {
        setError(null);
        try {
            // api.put handles JSON stringification and headers
            const data = await api.put(`/api/limited-partners/${id}/`, payload);
            setLimitedPartners(prev =>
                prev.map(lp => (lp.lp_id === id ? data : lp))
            );
            return data;
        } catch (err) {
            console.error(err);
            throw new Error(err.message || 'Update failed');
        }
    }, [api]);

    const deleteLimitedPartner = useCallback(async (id) => {
        setError(null);
        try {
            await api.delete(`/api/limited-partners/${id}/`);
            setLimitedPartners(prev =>
                prev.filter(lp => lp.lp_id !== id)
            );
        } catch (err) {
            console.error(err);
            throw new Error(err.message || 'Delete failed');
        }
    }, [api]);

    return {
        limitedPartners,
        isLoading,
        error,
        fetchLimitedPartners,
        createLimitedPartner,
        updateLimitedPartner,
        deleteLimitedPartner,
    };
}
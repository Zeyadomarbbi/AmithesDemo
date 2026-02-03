// useLimitedPartners.jsx
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../useApi';

export function useLimitedPartners() {
    const [limitedPartners, setLimitedPartners] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLimitedPartners = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/limited-partners/`, {
            });
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            setLimitedPartners(data);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createLimitedPartner = useCallback(async (payload) => {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/limited-partners/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        const data = await res.json();
        setLimitedPartners(prev => [...prev, data]);
        return data;
    }, []);

    const updateLimitedPartner = useCallback(async (id, payload) => {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/limited-partners/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update failed');
        const data = await res.json();
        setLimitedPartners(prev =>
            prev.map(lp => (lp.lp_id === id ? data : lp))
        );
        return data;
    }, []);

    const deleteLimitedPartner = useCallback(async (id) => {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/limited-partners/${id}/`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed');
        setLimitedPartners(prev =>
            prev.filter(lp => lp.lp_id !== id)
        );
    }, []);

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

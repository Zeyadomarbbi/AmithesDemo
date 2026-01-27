import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "./useApi";

export function useShareClasses(fundId) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        if (!fundId) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/funds/${fundId}/share-classes/`
            );
            if (!res.ok) throw new Error("Fetch failed");
            setData(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [fundId]);

    const create = async (payload) => {
        const res = await fetch(
            `${API_BASE_URL}/api/funds/${fundId}/share-classes/`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Create failed");
        }

        await fetchAll();
    };

    const update = async (id, payload) => {
        const res = await fetch(
            `${API_BASE_URL}/api/funds/${fundId}/share-classes/${id}/`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        if (!res.ok) throw new Error("Update failed");
        await fetchAll();
    };

    const remove = async (id) => {
        const res = await fetch(
            `${API_BASE_URL}/api/share-classes/${id}/`,
            { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Delete failed");
        await fetchAll();
    };

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        data,
        isLoading,
        error,
        fetchAll,
        create,
        update,
        remove,
    };
}

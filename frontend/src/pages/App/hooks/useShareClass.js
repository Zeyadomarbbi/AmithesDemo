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
        // 1. Check if we have a file to use FormData
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            if (payload[key] !== null && payload[key] !== undefined) {
                formData.append(key, payload[key]);
            }
        });

        console.log("payload", payload)
        const res = await fetch(
            `${API_BASE_URL}/api/funds/${fundId}/share-classes/`,
            {
                method: "POST",
                // Note: Don't set Content-Type header when sending FormData; 
                // the browser sets it automatically with the boundary.
                body: formData,
            }
        );

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error("Server 400 Validation Error:", errData);
            const errorMessage = Object.entries(errData)
                .map(([field, errors]) => {
                    const msg = Array.isArray(errors) ? errors.join(' ') : errors;
                    return `${field}: ${msg}`;
                })
                .join(' | ') || "Check your input and try again.";

            throw new Error(errorMessage);
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
            // Must match the fund-nested path defined in urls.py
            `${API_BASE_URL}/api/funds/${fundId}/share-classes/${id}/`,
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

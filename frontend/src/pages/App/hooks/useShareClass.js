import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from './useApi';

export function useShareClasses(fundId) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        if (!fundId) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/funds/${fundId}/share-classes/`);
            if (!res.ok) throw new Error("Fetch failed");
            setData(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [fundId]);

    const create = async (payload) => { 
        let body;
        let headers = {};

        // 1. Check for File
        if (payload.file) {
            const formData = new FormData();
            
            // Explicitly map keys to match Backend Serializer
            formData.append("document_file", payload.file); // KEY FIX: 'file' -> 'document_file'
            
            // Append other fields
            formData.append("share_class_name", payload.share_class_name);
            formData.append("isin_code", payload.isin_code);
            formData.append("nominal_value", payload.nominal_value);
            formData.append("issuance_method", payload.issuance_method);
            formData.append("distribution_method", payload.distribution_method);
            formData.append("ppm_description", payload.ppm_description);
            
            body = formData;
            // Browser sets Content-Type automatically
        } else {
            // 2. Fallback: Standard JSON
            body = JSON.stringify(payload);
            headers = { "Content-Type": "application/json" };
        }

        const res = await fetch(
            `${BASE_URL}/funds/${fundId}/share-classes/`,
            {
                method: "POST",
                headers: headers,
                body: body,
            }
        );

        if (!res.ok) {
            // Optional: Try to parse backend error message
            const errData = await res.json().catch(() => ({})); 
            throw new Error(errData.detail || "Create failed");
        }
        
        await fetchAll();
    };

    const update = async (id, payload) => {
        // You can apply similar FormData logic here if you plan to support 
        // updating files in the future. For now, it remains JSON.
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
import { useState, useCallback } from 'react';

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback(({ title, message, type = 'success', duration = 4000 }) => {
        setToast({ title, message, type, duration, key: Date.now() });
    }, []);

    const closeToast = useCallback(() => setToast(null), []);

    return { toast, showToast, closeToast };
}
// frontend/src/pages/App/hooks/LPsStatement/useOperationFullCreate.js
import { useCallback, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && data.detail) ||
      (data && data.error) ||
      (typeof data === "string" ? data : "") ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export function useOperationFullCreate() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const createFullOperation = useCallback(async (fundId, payload) => {
    if (!fundId) throw new Error("Missing fundId");
    if (!payload) throw new Error("Missing payload");

    setIsSaving(true);
    setError(null);

    try {
      // ✅ Adjust this path if your backend route is different
      // Common patterns: /funds/:fundId/operations/full-create/
      const url = `${API_BASE}/api/lps-statement/funds/${fundId}/operations/full-create/`;

      const data = await fetchJson(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return data;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    createFullOperation,
    isSaving,
    error,
  };
}

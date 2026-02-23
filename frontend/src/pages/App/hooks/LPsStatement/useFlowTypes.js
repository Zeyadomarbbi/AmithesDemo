// frontend/src/pages/App/hooks/LPsStatement/useFlowTypes.js
import { useCallback, useState } from "react";

// Customer-safe base (set this in hosting env OR runtime-config.js)
const RUNTIME =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) || {};

const API_BASE = String(
  RUNTIME.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

const API_PREFIX = String(
  RUNTIME.API_PREFIX || import.meta.env.VITE_API_PREFIX || ""
).replace(/\/$/, "");

// join helper to avoid // issues
function joinUrl(base, path) {
  const b = String(base || "").replace(/\/$/, "");
  const p = String(path || "");
  const pp = p.startsWith("/") ? p : `/${p}`;
  return b ? `${b}${pp}` : pp;
}

// ✅ ALWAYS use /api/flow-types/
function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;

  // local dev (no API_BASE): relative to same host
  if (!API_BASE) return `/api${p}`; // => "/api/flow-types/"

  // prod/customer
  const withPrefix = joinUrl(API_BASE, API_PREFIX);
  return joinUrl(withPrefix, `/api${p}`);
}

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
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return data;
}

export function useFlowTypes() {
  const [flowTypes, setFlowTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlowTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = apiUrl("/flow-types/"); // ✅ "/api/flow-types/"
      const data = await fetchJson(url, { method: "GET" });

      const list = Array.isArray(data) ? data : data?.results || [];
      setFlowTypes(Array.isArray(list) ? list : []);
      return list;
    } catch (e) {
      setError(e);
      setFlowTypes([]);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { flowTypes, fetchFlowTypes, isLoading, error };
}

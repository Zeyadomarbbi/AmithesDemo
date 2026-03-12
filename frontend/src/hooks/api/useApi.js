import { useMemo } from 'react';
import { API_BASE_URL } from "./apiConfig";

function getAccessToken() {
  return localStorage.getItem("access");
}

const formatBody = (data) => (data instanceof FormData ? data : JSON.stringify(data));

async function request(endpoint, options = {}) {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Request failed");
  }

  return response.json();
}

export default function useApi() {
  return useMemo(() => ({
    get: (endpoint, options = {}) => 
      request(endpoint, { method: "GET", ...options }),

    post: (endpoint, data, options = {}) =>
      request(endpoint, { 
        method: "POST", 
        ...(data && { body: formatBody(data) }), 
        ...options 
      }),

    put: (endpoint, data, options = {}) =>
      request(endpoint, { 
        method: "PUT", 
        ...(data && { body: formatBody(data) }), 
        ...options 
      }),

    patch: (endpoint, data, options = {}) =>
      request(endpoint, { 
        method: "PATCH", 
        ...(data && { body: formatBody(data) }), 
        ...options 
      }),

    delete: (endpoint, options = {}) => 
      request(endpoint, { method: "DELETE", ...options }),
  }), []);
}
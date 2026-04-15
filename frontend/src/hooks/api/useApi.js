import { useMemo } from 'react';
import { API_BASE_URL } from "./apiConfig";

function getAccessToken() {
  return localStorage.getItem("access");
}

const formatBody = (data) => (data instanceof FormData ? data : JSON.stringify(data));

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return false;

  const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) return false;

  const data = await response.json();
  localStorage.setItem('access', data.access);
  if (data.refresh) localStorage.setItem('refresh', data.refresh);
  return true;
}

async function request(endpoint, options = {}, retry = true) {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const isAuthRoute =
    endpoint.includes('/api/login/') ||
    endpoint.includes('/api/token/refresh/');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(!isAuthRoute && token && {
        "Authorization": `Bearer ${token}`
      }),
      ...options.headers,
    },
  });

  if (response.status === 401 && !isAuthRoute) {
    if (retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return request(endpoint, options, false);
    }
    
    // If we reach here, refresh failed or retry is exhausted
    localStorage.clear(); 
    window.location.href = "/login"; // Force redirect to break the loop
    return new Promise(() => {}); // Return a pending promise to stop execution
  }
  
  if (response.status === 204) return null;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Ensure the error message is always a string
    const errorMessage = errorData.detail || errorData.error || "Request failed";
    const error = new Error(errorMessage);
    error.response = { data: errorData, status: response.status };
    throw error;
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
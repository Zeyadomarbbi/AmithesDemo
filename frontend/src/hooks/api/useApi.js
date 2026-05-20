import { useMemo } from 'react';
import { API_BASE_URL } from "./apiConfig";

function getAccessToken() {
  return localStorage.getItem("access");
}

const formatBody = (data) => (data instanceof FormData ? data : JSON.stringify(data));

// Singleton lock for concurrent refresh requests
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = localStorage.getItem('refresh');
  if (!refresh) return false;

  refreshPromise = (async () => {
    try {
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
    } catch (error) {
      return false;
    } finally {
      refreshPromise = null; // Release lock
    }
  })();

  return refreshPromise;
}

async function request(endpoint, options = {}, retry = true) {
  let token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const isAuthRoute =
    endpoint.includes('/api/login/') ||
    endpoint.includes('/api/token/refresh/');

  const executeFetch = (currentToken) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(!isAuthRoute && currentToken && {
          "Authorization": `Bearer ${currentToken}`
        }),
        ...options.headers,
      },
    });
  };

  let response = await executeFetch(token);

  if (response.status === 401 && !isAuthRoute) {
    if (retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = getAccessToken(); // Retrieve the newly minted token
        response = await executeFetch(token); // Re-execute with new token
      } else {
        localStorage.clear(); 
        window.location.href = "/login"; 
        return new Promise(() => {}); 
      }
    } else {
      localStorage.clear(); 
      window.location.href = "/login"; 
      return new Promise(() => {});
    }
  }
  
  if (response.status === 204) return null;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
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
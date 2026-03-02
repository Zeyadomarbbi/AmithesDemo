import { API_BASE_URL } from "./apiConfig";

function getCSRFToken() {
  const cookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken="));
  return cookie ? cookie.split("=")[1] : null;
}

async function request(endpoint, options = {}) {
  const csrfToken = getCSRFToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(csrfToken && { "X-CSRFToken": csrfToken }),
      ...options.headers,
    },
  });

  // Global Auth Guard
  if (response.status === 401) {
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
  // Centralized body processor
  const formatBody = (data) => (data instanceof FormData ? data : JSON.stringify(data));

  return {
    get: (endpoint, options = {}) => 
      request(endpoint, { method: "GET", ...options }),

    post: (endpoint, data, options = {}) =>
      request(endpoint, { 
        method: "POST", 
        ...(data && { body: formatBody(data) }), // Only add body if data exists
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
  };
}
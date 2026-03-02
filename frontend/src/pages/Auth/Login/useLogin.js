import { useState } from "react";
import useApi from "../../App/hooks/api/useApi";

export default function useLogin() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // useApi handles the base URL, credentials, and JSON stringification
      const data = await api.post("/api/login/", { email, password });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
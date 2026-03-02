import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from './useApi'; // Adjust path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if session exists on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.get('/api/me/'); // Endpoint to return current user
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [api]);

  const login = async (email, password) => {
    const data = await api.post('/api/login/', { email, password });
    setUser(data.user); // Assuming backend returns { user: {...} }
    return data;
  };

  const logout = async () => {
    await api.post('/api/logout/');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
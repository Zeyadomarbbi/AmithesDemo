import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../api/useApi'; // Adjust path

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session check on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Ping the CSRF endpoint to verify the session cookie is still valid
        await api.get('/api/csrf/');
        
        // Retrieve cached user data for the UI
        const cachedUser = localStorage.getItem('amethis_user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('amethis_user');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [api]);

  // 2. Login Action (Updates global state)
  const loginAction = async (email, password) => {
    try {
      const data = await api.post('/api/login/', { email, password });
      setUser(data.user);
      localStorage.setItem('amethis_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 3. Logout Action (Clears global state)
  const logoutAction = async () => {
    try {
      await api.post('/api/logout/');
    } finally {
      setUser(null);
      localStorage.removeItem('amethis_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginAction, logout: logoutAction }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
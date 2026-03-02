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
        // 1. First get the CSRF cookie
        await api.get('/api/csrf/'); 
        
        // 2. Then verify if the session is still active
        const data = await api.get('/api/me/');
        setUser(data.user);
        localStorage.setItem('amethis_user', JSON.stringify(data.user));
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
      
      // 1. Save to storage first
      localStorage.setItem('amethis_user', JSON.stringify(data.user));
      
      // 2. Set the user state
      setUser(data.user);
      
      // 3. Return the data so the LoginPage can navigate
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
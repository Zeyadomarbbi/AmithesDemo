import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../api/useApi'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/api/me/');
        setUser(data.user);
        localStorage.setItem('amethis_user', JSON.stringify(data.user));
      } catch {
        setUser(null);
        localStorage.removeItem('amethis_user');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [api]);

  const loginAction = async (email, password) => {
    const data = await api.post('/api/login/', { email, password });
    
    // Critical: Persist JWT tokens
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('amethis_user', JSON.stringify(data.user));
    
    setUser(data.user);
    return data;
  };

  const logoutAction = () => {
    // API call is obsolete for stateless JWT. Clear local storage.
    setUser(null);
    localStorage.removeItem('amethis_user');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = "/login";
  };

  const canEdit = user?.is_staff || user?.is_superuser;
  const isViewer = user && !canEdit;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login: loginAction, 
      logout: logoutAction,
      canEdit,
      isViewer
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
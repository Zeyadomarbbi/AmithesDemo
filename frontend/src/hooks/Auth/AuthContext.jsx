import React, { createContext, useContext, useState, useEffect } from 'react';
import useApi from '../api/useApi';

const AuthContext = createContext(null);

// Utility functions for dual-storage handling
const getAuthData = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const clearAuthData = () => {
  ['access', 'refresh', 'amethis_user'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};
const setAuthData = (data, remember) => {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  
  // Clear opposite storage to prevent conflicts
  ['access', 'refresh', 'amethis_user'].forEach(key => otherStorage.removeItem(key));
  
  storage.setItem('access', data.access);
  storage.setItem('refresh', data.refresh);
  storage.setItem('amethis_user', JSON.stringify(data.user));
};
const updateUserData = (user) => {
  const storage = localStorage.getItem('access') ? localStorage : sessionStorage;
  storage.setItem('amethis_user', JSON.stringify(user));
};

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthData('access');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.get('/api/me/');
        setUser(data.user);
        updateUserData(data.user);
      } catch {
        setUser(null);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [api]);

  const loginAction = async (email, password, rememberMe = false) => {
    const data = await api.post('/api/login/', { email, password });
    setAuthData(data, rememberMe);
    setUser(data.user);
    return data;
  };

  const logoutAction = () => {
    setUser(null);
    clearAuthData();
    window.location.href = "/login";
  };

  const updateUser = async (fields) => {
    const data = await api.patch('/api/me/', fields);
    setUser(data.user);
    updateUserData(data.user);
    return data.user;
  };

  const updateProfile = async (fields) => {
    const data = await api.patch('/api/me/profile/', fields);
    setUser(data.user);
    updateUserData(data.user);
    return data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await api.post('/api/me/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const deleteUser = async () => {
    await api.delete('/api/me/delete/');
    setUser(null);
    clearAuthData();
    window.location.href = "/login";
  };

  const canEdit  = user?.is_staff || user?.is_superuser;
  const isViewer = user && !canEdit;

  return (
    <AuthContext.Provider value={{
      user, loading, login: loginAction, logout: logoutAction,
      updateUser, updateProfile, changePassword, deleteUser,
      canEdit, isViewer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
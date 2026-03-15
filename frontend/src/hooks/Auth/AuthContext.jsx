// AuthContext.jsx
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
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('amethis_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logoutAction = () => {
    setUser(null);
    localStorage.removeItem('amethis_user');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = "/login";
  };

  // PATCH /api/me/ — updates User fields (first_name, last_name, email, username)
  const updateUser = async (fields) => {
    const data = await api.patch('/api/me/', fields);
    setUser(data.user);
    localStorage.setItem('amethis_user', JSON.stringify(data.user));
    return data.user;
  };

  // PATCH /api/me/profile/ — updates UserProfile fields (title, birthday, country, timezone, phone, two_fa_enabled)
  const updateProfile = async (fields) => {
    const data = await api.patch('/api/me/profile/', fields);
    setUser(data.user);
    localStorage.setItem('amethis_user', JSON.stringify(data.user));
    return data.user;
  };

  // POST /api/me/change-password/
  const changePassword = async (currentPassword, newPassword) => {
    return await api.post('/api/me/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  // DELETE /api/me/delete/ — wipes account then logs out
  const deleteUser = async () => {
    await api.delete('/api/me/delete/');
    setUser(null);
    localStorage.removeItem('amethis_user');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = "/login";
  };

  const canEdit  = user?.is_staff || user?.is_superuser;
  const isViewer = user && !canEdit;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login:          loginAction,
      logout:         logoutAction,
      updateUser,
      updateProfile,
      changePassword,
      deleteUser,
      canEdit,
      isViewer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
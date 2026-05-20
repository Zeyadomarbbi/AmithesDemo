import { useState, useCallback } from 'react';
import useApi from '../../../../hooks/api/useApi';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const api = useApi();

  // Helper to map DB fields to UI fields
  const normalize = (u) => ({
    id: u.id,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    handle: `@${u.username}`,
    username: u.username, // keep raw for forms
    email: u.email,
    role: u.is_superuser ? 'Super Admin' : (u.is_staff ? 'Admin' : 'Viewer'),
    roleType: u.is_superuser ? 'green' : (u.is_staff ? 'blue' : 'grey'),
    status: u.is_active ? 'Active' : 'Inactive',
    statusType: u.is_active ? 'green' : 'grey',
    dateJoined: u.date_joined,
    is_staff: u.is_staff,
    is_superuser: u.is_superuser,
    is_active: u.is_active
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/users/');
      const userList = Array.isArray(data) ? data : (data.results || []);
      setUsers(userList.map(normalize));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const fetchUser = async (userId) => {
    setIsLoading(true);
    try {
      const data = await api.get(`/api/users/${userId}/`);
      return normalize(data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData) => {
    setIsLoading(true);
    try {
      const data = await api.post('/api/users/', userData);
      const newUser = normalize(data);
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId, updateData) => {
    setIsLoading(true);
    try {
      const data = await api.patch(`/api/users/${userId}/`, updateData);
      const updatedUser = normalize(data);
      setUsers((prev) => prev.map(u => u.id === userId ? updatedUser : u));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    setIsLoading(true);
    try {
      await api.delete(`/api/users/${userId}/`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  };
};
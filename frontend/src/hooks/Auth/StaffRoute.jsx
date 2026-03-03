import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const StaffRoute = () => {
  const { canEdit, loading } = useAuth();

  if (loading) return null;
  
  return canEdit ? <Outlet /> : <Navigate to="/all-funds" replace />;
};
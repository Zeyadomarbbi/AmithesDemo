import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // 🔍 TRACE LOGS
  console.log("[ProtectedRoute] Current Auth State:", { 
    user, 
    loading, 
    hasSessionCookie: document.cookie.includes('sessionid') 
  });

  if (loading) {
    console.log("[ProtectedRoute] Still loading session...");
    return <div></div>;
  }

  if (!user) {
    console.warn("[ProtectedRoute] No user found. Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("[ProtectedRoute] User authenticated. Mounting App domain...");
  return <Outlet />;
};

export default ProtectedRoute;
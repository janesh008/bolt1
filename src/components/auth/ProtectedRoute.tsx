import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, checkAuth, isDevMode } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!user && !isLoading && !isDevMode) {
      checkAuth();
    }
  }, [user, isLoading, checkAuth, isDevMode]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Allow access in dev mode or if user is authenticated
  if (!user && !isDevMode) {
    return <Navigate to="/login\" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
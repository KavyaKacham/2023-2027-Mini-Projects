import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // Show full-screen loading while auth state is being determined
  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying access..." />;
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route but user is not admin → redirect to dashboard
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated (and authorized) → render children
  return children;
};

export default ProtectedRoute;

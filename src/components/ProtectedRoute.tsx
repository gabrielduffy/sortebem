import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'manager' | 'establishment')[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated - redirect to appropriate login page
  if (!isAuthenticated || !user) {
    // Determine redirect based on allowed roles
    if (allowedRoles) {
      if (allowedRoles.includes('admin')) {
        return <Navigate to="/admin/login" replace />;
      } else if (allowedRoles.includes('manager')) {
        return <Navigate to="/gerente/login" replace />;
      } else if (allowedRoles.includes('establishment')) {
        return <Navigate to="/estabelecimento/login" replace />;
      }
    }

    // Default redirect
    return <Navigate to={redirectTo || '/'} replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have permission - redirect to their appropriate dashboard
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'manager':
        return <Navigate to="/gerente" replace />;
      case 'establishment':
        return <Navigate to="/estabelecimento" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'recruiter' | 'student';
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireAuth = true
}) => {
  const { user } = useAuthStore();

  // If authentication is required and user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in but a specific role is required
  if (requiredRole && user && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'recruiter':
        return <Navigate to="/recruiter" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  // If authentication is not required and user is logged in, redirect to their dashboard
  if (!requireAuth && user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'recruiter':
        return <Navigate to="/recruiter" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
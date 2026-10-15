import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route and redirects if the user is not authenticated
 * or does not have the required role.
 * Props:
 *   - role: 'SUPPLIER' | 'RESTAURANT' (required)
 *   - children: the protected component tree
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // Authenticated but wrong role — send to their own dedicated dashboard
    let dest = '/login';
    if (user.role === 'ADMIN') dest = '/admin/dashboard';
    else if (user.role === 'SUPPLIER') dest = '/supplier/dashboard';
    else if (user.role === 'RESTAURANT') dest = '/restaurant/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
}

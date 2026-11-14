import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * PublicOnlyRoute component.
 * Used for public auth pages (Login, Register).
 * If the user is already authenticated with an active session, redirects to / (Dashboard).
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fitverse-bg">
        <Loader2 className="w-6 h-6 animate-spin text-fitverse-purple" />
      </div>
    );
  }

  if (isAuthenticated) {
    // If user arrived from another page, return there; otherwise to Dashboard
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
}


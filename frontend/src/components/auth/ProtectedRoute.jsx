import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import FitVerseLogo from '../common/FitVerseLogo';

/**
 * Reusable ProtectedRoute component.
 * Verifies active authentication session before allowing access to private routes.
 * If unauthenticated or token is missing/expired, redirects immediately to /login.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fitverse-bg select-none gap-4">
        <FitVerseLogo size="lg" />
        <div className="flex items-center gap-2.5 text-xs font-semibold text-fitverse-purple">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying authentication session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated requests to login, preserving intended destination
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}


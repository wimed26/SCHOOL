import { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getRolePermissions, isRouteAllowed } from '@/lib/rolePermissions';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import WaitingApproval from '@/components/WaitingApproval';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const location = useLocation();
  const [routeCheck, setRouteCheck] = useState({ loading: false, allowed: true });

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setRouteCheck({ loading: false, allowed: true });
      return;
    }
    setRouteCheck({ loading: true, allowed: true });
    getRolePermissions(user.role).then((routes) => {
      setRouteCheck({ loading: false, allowed: isRouteAllowed(location.pathname, routes) });
    });
  }, [user, location.pathname]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (user?.role !== 'admin' && !user?.is_approved) {
    return <WaitingApproval user={user} />;
  }

  if (!routeCheck.loading && !routeCheck.allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
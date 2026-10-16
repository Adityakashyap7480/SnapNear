import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_HOME, ROLES, type Role } from '../config/constants';
import { ROUTES } from '../config/routes';
import { PageLoader } from '../components/ui/Spinner';

/** Customers & partners belong in the other app on the same domain; the shared token goes with them. */
function LeaveForApp({ role }: { role: Exclude<Role, 'superadmin'> }) {
  useEffect(() => {
    window.location.replace(APP_HOME[role]);
  }, [role]);
  return <PageLoader />;
}

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  if (user.role !== ROLES.SUPER_ADMIN) return <LeaveForApp role={user.role} />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  if (user?.role === ROLES.SUPER_ADMIN) return <Navigate to={ROUTES.PLATFORM} replace />;
  if (user) return <LeaveForApp role={user.role} />;
  return <Outlet />;
}

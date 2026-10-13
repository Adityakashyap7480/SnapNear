import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/constants';
import { ROUTES } from '../config/routes';
import { PageLoader } from '../components/ui/Spinner';

export function ProtectedRoute({ roles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || ROUTES.LOGIN} replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || ROUTES.HOME} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  return <Navigate to={user ? ROLE_HOME[user.role] : ROUTES.LOGIN} replace />;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../config/constants';
import { PageLoader } from '../components/ui/Spinner';

export function ProtectedRoute({ roles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader />;
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}

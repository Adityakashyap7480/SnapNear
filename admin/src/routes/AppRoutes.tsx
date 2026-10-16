import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';
import PortalLayout from '../layouts/PortalLayout';
import LoginPage from '../pages/LoginPage';
import PlatformDashboardPage from '../pages/PlatformDashboardPage';
import CustomersPage from '../pages/CustomersPage';
import PartnersPage from '../pages/PartnersPage';
import PayoutsPage from '../pages/PayoutsPage';
import NotFoundPage from '../pages/NotFoundPage';
import { ROUTES } from '../config/routes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.PLATFORM} replace />} />
          <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
          <Route path={ROUTES.PARTNERS} element={<PartnersPage />} />
          <Route path={ROUTES.PLATFORM} element={<PlatformDashboardPage />} />
          <Route path={ROUTES.PAYOUTS} element={<PayoutsPage />} />
        </Route>
      </Route>

      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}

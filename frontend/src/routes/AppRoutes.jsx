import { Route, Routes } from 'react-router-dom';
import { GuestRoute, HomeRedirect, ProtectedRoute } from './ProtectedRoute';
import PortalLayout from '../layouts/PortalLayout';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import BookShootPage from '../pages/customer/BookShootPage';
import PartnerAppPage from '../pages/partner/PartnerAppPage';
import PlatformDashboardPage from '../pages/admin/PlatformDashboardPage';
import AdminCustomersPage from '../pages/admin/AdminCustomersPage';
import AdminPartnersPage from '../pages/admin/AdminPartnersPage';
import AdminPayoutsPage from '../pages/admin/AdminPayoutsPage';
import NotFoundPage from '../pages/NotFoundPage';
import { ROLES } from '../config/constants';
import { ROUTES } from '../config/routes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomeRedirect />} />

      <Route element={<GuestRoute />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.CLIENT]} />}>
        <Route element={<PortalLayout />}>
          <Route path={ROUTES.BOOK} element={<BookShootPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.CREATOR]} />}>
        <Route element={<PortalLayout />}>
          <Route path={ROUTES.PARTNER} element={<PartnerAppPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<PortalLayout />}>
          <Route path={ROUTES.ADMIN} element={<HomeRedirect />} />
          <Route path={ROUTES.ADMIN_CUSTOMERS} element={<AdminCustomersPage />} />
          <Route path={ROUTES.ADMIN_PARTNERS} element={<AdminPartnersPage />} />
          <Route path={ROUTES.ADMIN_PLATFORM} element={<PlatformDashboardPage />} />
          <Route path={ROUTES.ADMIN_PAYOUTS} element={<AdminPayoutsPage />} />
        </Route>
      </Route>

      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}

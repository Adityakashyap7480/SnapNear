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
import NotFoundPage from '../pages/NotFoundPage';
import { ROLES } from '../config/constants';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.CLIENT]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/book" element={<BookShootPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.CREATOR]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/partner" element={<PartnerAppPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.SUPER_ADMIN]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin" element={<HomeRedirect />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/partners" element={<AdminPartnersPage />} />
          <Route path="/admin/platform" element={<PlatformDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

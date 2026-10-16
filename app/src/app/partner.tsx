import PortalLayout from '../components/layout/PortalLayout';
import { RequireRole } from '../components/layout/RouteGuards';
import { ROLES } from '../config/constants';
import PartnerScreen from '../screens/PartnerScreen';

export default function Partner() {
  return (
    <RequireRole roles={[ROLES.CREATOR]}>
      <PortalLayout>
        <PartnerScreen />
      </PortalLayout>
    </RequireRole>
  );
}

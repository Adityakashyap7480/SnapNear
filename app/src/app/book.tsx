import PortalLayout from '../components/layout/PortalLayout';
import { RequireRole } from '../components/layout/RouteGuards';
import { ROLES } from '../config/constants';
import BookScreen from '../screens/BookScreen';

export default function Book() {
  return (
    <RequireRole roles={[ROLES.CLIENT]}>
      <PortalLayout>
        <BookScreen />
      </PortalLayout>
    </RequireRole>
  );
}

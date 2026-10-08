import { Router } from 'express';
import {
  cancelBooking,
  getOverview,
  listBookings,
  listClients,
  listCreators,
  updateUserStatus,
} from '../controllers/admin.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { adminBookingQuerySchema, updateUserStatusSchema } from '../validators/schemas.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.SUPER_ADMIN));

router.get('/overview', getOverview);
router.get('/bookings', validate(adminBookingQuerySchema, 'query'), listBookings);
router.patch('/bookings/:id/cancel', cancelBooking);
router.get('/clients', listClients);
router.get('/creators', listCreators);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);

export default router;

import { Router } from 'express';
import { cancelMyBooking, createBooking, getMyBookings } from '../controllers/booking.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createBookingSchema } from '../validators/schemas.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.CLIENT));

router.post('/', validate(createBookingSchema), createBooking);
router.get('/mine', getMyBookings);
router.patch('/:id/cancel', cancelMyBooking);

export default router;

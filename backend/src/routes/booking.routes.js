import { Router } from 'express';
import { cancelMyBooking, createBooking, getMyBookings, refreshStartOtp } from '../controllers/booking.controller.js';
import { clientPaymentStatus, confirmCheckout, startCheckout } from '../controllers/payment.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createBookingSchema, verifyPaymentSchema } from '../validators/schemas.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.CLIENT));

router.post('/', validate(createBookingSchema), createBooking);
router.get('/mine', getMyBookings);
router.patch('/:id/cancel', cancelMyBooking);
router.post('/:id/start-otp', refreshStartOtp);
router.post('/:id/pay', startCheckout);
router.post('/:id/pay/verify', validate(verifyPaymentSchema), confirmCheckout);
router.get('/:id/payment', clientPaymentStatus);

export default router;

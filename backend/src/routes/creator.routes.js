import { Router } from 'express';
import {
  acceptRequest,
  advanceJob,
  declineRequest,
  getDashboard,
  setDutyStatus,
  updateProfile,
} from '../controllers/creator.controller.js';
import { collectLink, creatorPaymentStatus } from '../controllers/payment.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { dutyStatusSchema, updateCreatorProfileSchema } from '../validators/schemas.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(protect, authorize(ROLES.CREATOR));

router.get('/dashboard', getDashboard);
router.patch('/status', validate(dutyStatusSchema), setDutyStatus);
router.patch('/profile', validate(updateCreatorProfileSchema), updateProfile);
router.post('/requests/:id/accept', acceptRequest);
router.post('/requests/:id/decline', declineRequest);
router.patch('/jobs/:id/advance', advanceJob);
router.post('/jobs/:id/collect', collectLink);
router.get('/jobs/:id/payment', creatorPaymentStatus);

export default router;

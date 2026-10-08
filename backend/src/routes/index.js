import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import creatorRoutes from './creator.routes.js';
import adminRoutes from './admin.routes.js';
import { getCatalog } from '../controllers/meta.controller.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
router.get('/catalog', getCatalog);

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/creator', creatorRoutes);
router.use('/admin', adminRoutes);

export default router;

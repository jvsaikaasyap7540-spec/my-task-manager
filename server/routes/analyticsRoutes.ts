import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', analyticsController.getAnalytics);
router.get('/daily', analyticsController.getAnalytics);
router.get('/weekly', analyticsController.getAnalytics);
router.get('/monthly', analyticsController.getAnalytics);

export default router;

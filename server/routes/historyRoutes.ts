import { Router } from 'express';
import * as historyController from '../controllers/historyController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

router.get('/', historyController.getHistoryDays);
router.get('/:date', historyController.getHistoryByDate);

export default router;

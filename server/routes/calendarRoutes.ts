import { Router } from 'express';
import * as calendarController from '../controllers/calendarController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);
router.get('/:month', calendarController.getCalendarMonth);

export default router;

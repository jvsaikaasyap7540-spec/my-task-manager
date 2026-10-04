import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import * as historyService from '../services/historyService.ts';

export async function getCalendarMonth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { month } = req.params; // e.g. 2026-09

    if (!month) {
      res.status(422).json({ success: false, message: 'Month parameter is required (YYYY-MM)' });
      return;
    }

    const days = await historyService.getCalendarMonthData(userId, month);
    res.json({
      success: true,
      month,
      days,
    });
  } catch (err: any) {
    console.error('Calendar error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve calendar data' });
  }
}

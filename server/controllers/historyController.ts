import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import * as historyService from '../services/historyService.ts';

export async function getHistoryDays(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const days = await historyService.getHistoryDays(userId);
    res.json({ success: true, days });
  } catch (err: any) {
    console.error('History days error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve history overview' });
  }
}

export async function getHistoryByDate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { date } = req.params;

    if (!date) {
      res.status(422).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD)' });
      return;
    }

    const data = await historyService.getHistoryByDate(userId, date);
    res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('History by date error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve history for the selected date' });
  }
}

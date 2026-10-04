import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import * as historyService from '../services/historyService.ts';

export async function getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const analytics = await historyService.getAnalyticsData(userId);
    res.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics data' });
  }
}

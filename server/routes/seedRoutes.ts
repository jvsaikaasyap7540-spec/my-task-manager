import { Router, Request, Response } from 'express';
import { seedDemoData } from '../seed.ts';

const router = Router();

router.post('/reset', async (req: Request, res: Response) => {
  try {
    await seedDemoData();
    res.json({
      success: true,
      message: 'Demo dataset reset successfully with rich tasks and immutable activity history',
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset demo data' });
  }
});

export default router;

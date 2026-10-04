import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.ts';
import taskRoutes from './server/routes/taskRoutes.ts';
import historyRoutes from './server/routes/historyRoutes.ts';
import calendarRoutes from './server/routes/calendarRoutes.ts';
import analyticsRoutes from './server/routes/analyticsRoutes.ts';
import seedRoutes from './server/routes/seedRoutes.ts';
import { getDb } from './server/db/database.ts';
import { ensureDemoAccount, removeDemoSeedTasks } from './server/seed.ts';
import { startPendingTaskAlertScheduler } from './server/services/pendingTaskAlertService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Initialize SQLite database
  await getDb();

  await ensureDemoAccount();
  await removeDemoSeedTasks();
  startPendingTaskAlertScheduler();

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/seed', seedRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'DayFlow API',
    });
  });

  // Catch-all for API 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Vite integration or static serving
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DayFlow fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting DayFlow server:', err);
  process.exit(1);
});

// src/routes/admin.routes.ts
import { Hono } from 'hono';
import { CacheWarmupProgressService } from '../services/cache-warmup-progress.service';
import { WarmupSchedulerService } from '../services/warmup-scheduler.service';

const app = new Hono();
const progressService = new CacheWarmupProgressService();

export const initAdminRoutes = (warmupScheduler: WarmupSchedulerService) => {
  // Basic cache status and manual warmup endpoints
  app.get('/cache/status', async (c) => {
    return c.json(warmupScheduler.getStatus());
  });

  app.post('/cache/warmup', async (c) => {
    await warmupScheduler.manualWarmup();
    return c.json({ message: 'Cache warmup triggered' });
  });

  // Detailed warmup session management
  app.get('/cache/warmup/sessions', async (c) => {
    const limit = parseInt(c.req.query('limit') || '10');
    const sessions = await progressService.getRecentSessions(limit);
    return c.json(sessions);
  });

  app.get('/cache/warmup/sessions/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const session = await progressService.getSession(sessionId);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json(session);
  });

  app.get('/cache/warmup/summary', async (c) => {
    const sessions = await progressService.getRecentSessions(1);
    if (sessions.length === 0) {
      return c.json({
        status: 'no_recent_sessions',
        lastRun: null,
      });
    }

    const latestSession = sessions[0];
    const summary = {
      status: latestSession.status,
      progress: latestSession.progress,
      startTime: latestSession.startTime,
      endTime: latestSession.endTime,
      duration: latestSession.endTime
        ? new Date(latestSession.endTime).getTime() -
          new Date(latestSession.startTime).getTime()
        : null,
      taskSummary: Object.values(latestSession.tasks).map((task) => ({
        type: task.taskType,
        status: task.status,
        progress: `${task.completed}/${task.total}`,
        failed: task.failed,
        estimatedTimeRemaining: task.details.estimatedTimeRemaining,
      })),
    };
    return c.json(summary);
  });

  return app;
};

export { app as adminRoutes };

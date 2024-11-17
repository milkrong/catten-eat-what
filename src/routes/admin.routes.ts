// src/routes/admin.routes.ts
import { Hono } from 'hono';
import { CacheWarmupProgressService } from '../services/cache-warmup-progress.service';

const app = new Hono();
const progressService = new CacheWarmupProgressService();

// 获取当前/最近的预热会话
app.get('/cache/warmup/sessions', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const sessions = await progressService.getRecentSessions(limit);
  return c.json(sessions);
});

// 获取特定会话的详细信息
app.get('/cache/warmup/sessions/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const session = await progressService.getSession(sessionId);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  return c.json(session);
});

// 获取预热进度摘要
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

export { app as adminRoutes };

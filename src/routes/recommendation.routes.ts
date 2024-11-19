import { Hono } from 'hono';
import { RecommendationService } from '../services/recommendation.service';

const recommendationRoutes = new Hono();
const recommendationService = new RecommendationService();

recommendationRoutes.post('/single', async (c) => {
  const preferences = await c.req.json();
  const recommendation =
    await recommendationService.getSingleMealRecommendation(preferences);
  return c.json(recommendation);
});

recommendationRoutes.post('/daily', async (c) => {
  const preferences = await c.req.json();
  const recommendations =
    await recommendationService.getDailyPlanRecommendation(preferences);
  return c.json(recommendations);
});

recommendationRoutes.post('/weekly', async (c) => {
  const preferences = await c.req.json();
  const recommendations =
    await recommendationService.getWeeklyPlanRecommendation(preferences);
  return c.json(recommendations);
});

recommendationRoutes.post('/single/stream', async (c) => {
  const preferences = await c.req.json();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  // 使用 Web Streams API
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // 启动异步推荐过程
  recommendationService
    .getStreamingSingleMealRecommendation(preferences, (chunk) => {
      writer.write(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ content: chunk })}\n\n`
        )
      );
    })
    .then(() => {
      writer.write(new TextEncoder().encode('data: [DONE]\n\n'));
      writer.close();
    });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

export { recommendationRoutes };

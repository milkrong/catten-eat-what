import { Hono } from 'hono';
import { RecommendationService } from '../services/recommendation.service';

const recommendationRoutes = new Hono();
const recommendationService = new RecommendationService();

recommendationRoutes.post('/single', async (c) => {
  const request = await c.req.json();
  const user_id = c.get('userId');

  console.log(request, user_id);
  const recommendation =
    await recommendationService.getSingleMealRecommendation(request);
  return c.json(recommendation);
});

recommendationRoutes.post('/daily', async (c) => {
  const request = await c.req.json();
  const recommendations =
    await recommendationService.getDailyPlanRecommendation(request);
  return c.json(recommendations);
});

recommendationRoutes.post('/weekly', async (c) => {
  const request = await c.req.json();
  const recommendations =
    await recommendationService.getWeeklyPlanRecommendation(request);
  return c.json(recommendations);
});

recommendationRoutes.post('/single/stream', async (c) => {
  const request = await c.req.json();

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  // 使用 Web Streams API
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // 启动异步推荐过程
  recommendationService
    .getStreamingSingleMealRecommendation(request, (chunk) => {
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

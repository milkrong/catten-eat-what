// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware, optionalAuthMiddleware } from './middlewares/auth';
import { recipeRoutes } from './routes/recipe.routes';
import { mealPlanRoutes } from './routes/meal-plan.routes';
import { supabase } from './config/supabase';
import { WarmupSchedulerService } from './services/warmup-scheduler.service';

const app = new Hono();

// 创建预热调度器
const warmupScheduler = new WarmupSchedulerService(supabase, {
  initialDelay: 5000, // 服务启动5秒后开始预热
  warmupInterval: 30, // 每30分钟预热一次
  popularRecipeCount: 50, // 预热50个热门食谱
  recentRecipeCount: 30, // 预热30个最新食谱
  popularCuisineTypes: ['chinese', 'western', 'japanese', 'korean'], // 热门菜系
});

// 启动预热调度器
warmupScheduler.start();

// 全局中间件
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://your-production-domain.com'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 健康检查 - 无需认证
app.get('/health', (c) => c.json({ status: 'ok' }));

// API路由
const api = new Hono();

// 公开路由 - 使用可选认证
api.use('/recipes', optionalAuthMiddleware);
api.route('/recipes', recipeRoutes);

// 需要认证的路由
api.use('/meal-plans/*', authMiddleware);
api.route('/meal-plans', mealPlanRoutes);

// 添加预热状态检查接口
app.get('/api/admin/cache/status', async (c) => {
  return c.json(warmupScheduler.getStatus());
});

// 添加手动预热接口
app.post('/api/admin/cache/warmup', async (c) => {
  await warmupScheduler.manualWarmup();
  return c.json({ message: 'Cache warmup triggered' });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Stopping warmup scheduler...');
  warmupScheduler.stop();
});

// 认证相关的路由处理
api.post('/auth/register', async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    // 创建用户
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    if (user) {
      // 创建用户档案
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          username,
          avatar_url: null,
        },
      ]);

      if (profileError) throw profileError;
    }

    return c.json({
      message: '注册成功，请检查邮箱完成验证',
      user,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return c.json({
      message: '登录成功',
      session,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

api.post('/auth/logout', authMiddleware, async (c) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return c.json({ message: '退出登录成功' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 挂载API路由
app.route('/api', api);

// 全局错误处理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        message: err.message,
        code: err.status,
      },
      err.status
    );
  }

  console.error(`[Error] ${err}`);
  return c.json(
    {
      message: 'Internal Server Error',
      code: 500,
    },
    500
  );
});

// 404处理
app.notFound((c) => {
  return c.json(
    {
      message: 'Not Found',
      code: 404,
    },
    404
  );
});

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
};

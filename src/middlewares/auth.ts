// src/middlewares/auth.ts
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../config/supabase';

// 认证中间件
export const authMiddleware = async (c: Context, next: Next) => {
  console.log('authMiddleware');
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: '无效的认证令牌' }, 401);
    }

    // 将用户信息添加到上下文中
    c.set('userId', user.id);
    c.set('user', user);

    await next();
  } catch (error: any) {
    return c.json({ error: '认证失败' }, 401);
  }
};

// 权限检查中间件生成器
export const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user?.user_metadata?.role) {
      throw new HTTPException(403, { message: '没有所需权限' });
    }

    if (user.user_metadata.role !== requiredRole) {
      throw new HTTPException(403, { message: '没有所需权限' });
    }

    await next();
  };
};

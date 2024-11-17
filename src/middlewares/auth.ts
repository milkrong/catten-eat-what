// src/middlewares/auth.ts
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../config/supabase';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // 从请求头获取认证token
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      throw new HTTPException(401, { message: '未提供认证信息' });
    }

    // 验证Bearer token格式
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new HTTPException(401, { message: '无效的认证格式' });
    }

    // 验证JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new HTTPException(401, { message: '无效的认证token' });
    }

    // 在上下文中保存用户信息
    c.set('userId', user.id);
    c.set('user', user);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: '认证失败' });
  }
};

// 可选的认证中间件 - 用于某些端点可以选择是否登录
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader) {
      const [bearer, token] = authHeader.split(' ');
      if (bearer === 'Bearer' && token) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);
        if (!error && user) {
          c.set('userId', user.id);
          c.set('user', user);
        }
      }
    }

    await next();
  } catch (error) {
    await next();
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

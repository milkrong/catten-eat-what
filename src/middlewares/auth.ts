// src/middlewares/auth.ts
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';

// 导出 Clerk 中间件
export { clerkMiddleware };

// 认证中间件
export const authMiddleware = async (c: Context, next: Next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  // 将用户ID添加到上下文中
  c.set('userId', auth.userId);

  await next();
};

// 可选的认证中间件
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const auth = getAuth(c);

  if (auth?.userId) {
    c.set('userId', auth.userId);
  }

  await next();
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

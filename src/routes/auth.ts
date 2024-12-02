import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middlewares/auth';

const auth = new Hono();

// 用户注册后的 webhook 处理
auth.post('/webhook', async (c) => {
  const evt = await c.req.json();

  if (evt.type === 'user.created') {
    const { id, email_addresses, username } = evt.data;

    // 在 Supabase 中创建用户记录
    const { error } = await supabase.from('users').insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address,
      username: username,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return c.json({ error: error.message }, 500);
    }
  }

  return c.json({ success: true });
});

// 获取当前用户信息
auth.get('/me', authMiddleware, async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // 从 Supabase 获取用户额外信息
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', auth.userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(userData);
});

export default auth;

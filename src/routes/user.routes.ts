import { Hono } from 'hono';
import { supabase } from '../config/supabase';
import { Variables } from '../types/hono';

const app = new Hono<{ Variables: Variables }>();

// 获取用户信息
app.get('/profile', async (c) => {
  const userId = c.get('userId');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(profile);
});

// 更新用户资料
app.put('/profile', async (c) => {
  const userId = c.get('userId');
  const updates = await c.req.json();

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(profile);
});

// 获取用户的食谱收藏
app.get('/favorites', async (c) => {
  const userId = c.get('userId');

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select(
      `
      id,
      recipe_id,
      recipes (*)
    `
    )
    .eq('user_id', userId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(favorites);
});

// 添加食谱到收藏
app.post('/favorites/:recipeId', async (c) => {
  const userId = c.get('userId');
  const recipeId = c.req.param('recipeId');

  const { error } = await supabase
    .from('favorites')
    .insert([{ user_id: userId, recipe_id: recipeId }]);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: 'Recipe added to favorites' });
});

// 从收藏中移除食谱
app.delete('/favorites/:recipeId', async (c) => {
  const userId = c.get('userId');
  const recipeId = c.req.param('recipeId');

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: 'Recipe removed from favorites' });
});

// 获取用户偏好设置
app.get('/preferences', async (c) => {
  const userId = c.get('userId');

  const { data: preferences, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(preferences);
});

// 更新用户偏好设置
app.put('/preferences', async (c) => {
  const userId = c.get('userId');
  const updates = await c.req.json();
  console.log('updates', updates);
  const { data: preferences, error } = await supabase
    .from('preferences')
    .upsert({
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }

  return c.json(preferences);
});

export const userRoutes = app;

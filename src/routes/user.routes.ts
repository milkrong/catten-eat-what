import { Hono } from "hono";
import { supabase } from "../config/supabase";
import type { Variables } from "../types/hono";

const app = new Hono<{ Variables: Variables }>();

// 获取用户完整信息（包含个人资料、偏好设置和系统设置）
app.get("/info", async (c) => {
  console.log("get user info");
  const userId = c.get("userId");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      preferences:preferences!preferences_id_fkey(*),
      settings:settings!user_id(
        id,
        user_id,
        llm_service,
        model_name,
        is_paid,
        api_endpoint,
        created_at,
        updated_at
      ),
      favorites:favorites!favorites_user_id_fkey(
        id,
        recipe_id,
        created_at
      )
    `
    )
    .eq("id", userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({
    profile: {
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    preferences: data.preferences,
    settings: data.settings,
    favorites: data.favorites,
  });
});

// 获取用户信息
app.get("/profile", async (c) => {
  const userId = c.get("userId");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(profile);
});

// 更新用户资料
app.put("/profile", async (c) => {
  const userId = c.get("userId");
  const updates = await c.req.json();

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(profile);
});

// 获取用户的食谱收藏
app.get("/favorites", async (c) => {
  const userId = c.get("userId");

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select(
      `
      id,
      recipe_id,
      recipes (*)
    `
    )
    .eq("user_id", userId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(favorites);
});

// 添加食谱到收藏
app.post("/favorites/:recipeId", async (c) => {
  const userId = c.get("userId");
  const recipeId = c.req.param("recipeId");

  const { error } = await supabase
    .from("favorites")
    .insert([{ user_id: userId, recipe_id: recipeId }]);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: "Recipe added to favorites" });
});

// 从收藏中移除食谱
app.delete("/favorites/:recipeId", async (c) => {
  const userId = c.get("userId");
  const recipeId = c.req.param("recipeId");

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("recipe_id", recipeId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ message: "Recipe removed from favorites" });
});

// 获取用户偏好设置
app.get("/preferences", async (c) => {
  const userId = c.get("userId");

  const { data: preferences, error } = await supabase
    .from("preferences")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(preferences);
});

// 更新用户偏好设置
app.put("/preferences", async (c) => {
  const userId = c.get("userId");
  const updates = await c.req.json();
  console.log("updates", updates);
  const { data: preferences, error } = await supabase
    .from("preferences")
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

// 获取用户设置
app.get("/settings", async (c) => {
  const userId = c.get("userId");

  const { data: settings, error } = await supabase
    .from("settings")
    .select(
      "id, user_id, llm_service, model_name, is_paid, api_endpoint, created_at, updated_at"
    )
    .eq("user_id", userId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(settings);
});

// 更新用户设置
app.put("/settings", async (c) => {
  const userId = c.get("userId");
  const updates = await c.req.json();

  const { data: settings, error } = await supabase
    .from("settings")
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, user_id, llm_service, model_name, is_paid, api_endpoint, created_at, updated_at"
    )
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(settings);
});

export const userRoutes = app;

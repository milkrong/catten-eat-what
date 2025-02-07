import { Hono } from "hono";
import type { Variables } from "../types/hono";
import { UserService } from "../services/user.service";

const app = new Hono<{ Variables: Variables }>();
const userService = new UserService();

// 获取用户完整信息（包含个人资料、偏好设置和系统设置）
app.get("/info", async (c) => {
  try {
    const userId = c.get("userId");
    const userInfo = await userService.getUserInfo(userId);

    if (!userInfo) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户信息
app.get("/profile", async (c) => {
  try {
    const userId = c.get("userId");
    const profile = await userService.getProfile(userId);

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户资料
app.put("/profile", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    const profile = await userService.updateProfile(userId, updates);

    return c.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户的食谱收藏
app.get("/favorites", async (c) => {
  try {
    const userId = c.get("userId");
    const favorites = await userService.getFavorites(userId);

    return c.json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 添加食谱到收藏
app.post("/favorites/:recipeId", async (c) => {
  try {
    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    const favorite = await userService.addFavorite(userId, recipeId);

    return c.json({ message: "Recipe added to favorites", favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 从收藏中移除食谱
app.delete("/favorites/:recipeId", async (c) => {
  try {
    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    await userService.removeFavorite(userId, recipeId);

    return c.json({ message: "Recipe removed from favorites" });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户偏好设置
app.get("/preferences", async (c) => {
  try {
    const userId = c.get("userId");
    const preferences = await userService.getPreferences(userId);

    if (!preferences) {
      return c.json({ error: "Preferences not found" }, 404);
    }

    return c.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户偏好设置
app.put("/preferences", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    const preferences = await userService.upsertPreferences(userId, updates);

    return c.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户设置
app.get("/settings", async (c) => {
  try {
    const userId = c.get("userId");
    const settings = await userService.getSettings(userId);

    if (!settings) {
      return c.json({ error: "Settings not found" }, 404);
    }

    return c.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户设置
app.put("/settings", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    const settings = await userService.upsertSettings(userId, updates);

    return c.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export const userRoutes = app;

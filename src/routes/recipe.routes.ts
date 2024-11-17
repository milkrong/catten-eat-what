// src/routes/recipe.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RecipeService } from '../services/recipe.service';
import { supabase } from '../config/supabase';
import type { Recipe, RecipeFilters } from '../types';

// 创建Recipe服务实例
const recipeService = new RecipeService(supabase);

// 验证Schema
const createRecipeSchema = z.object({
  name: z.string().min(1, '菜品名称不能为空'),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.number().positive(),
      unit: z.string(),
    })
  ),
  steps: z.array(
    z.object({
      order: z.number().int().positive(),
      description: z.string(),
    })
  ),
  calories: z.number().positive(),
  cooking_time: z.number().positive(),
  nutrition_facts: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),·
    fiber: z.number(),
  }),
  cuisine_type: z.string(),
  diet_type: z.array(z.string()),
});

// 路由处理
const app = new Hono();

// 获取食谱列表
app.get('/', async (c) => {
  try {
    const filters: RecipeFilters = {
      cuisineType: c.req.query('cuisineType'),
      maxCookingTime: c.req.query('maxCookingTime')
        ? parseInt(c.req.query('maxCookingTime'))
        : undefined,
      dietType: c.req.query('dietType')?.split(','),
    };

    const recipes = await recipeService.getRecipes(filters);
    return c.json(recipes);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 获取单个食谱
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const recipe = await recipeService.getRecipeById(id);

    if (!recipe) {
      return c.json({ error: '食谱不存在' }, 404);
    }

    return c.json(recipe);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 创建新食谱
app.post('/', zValidator('json', createRecipeSchema), async (c) => {
  try {
    const recipeData = await c.req.json<Recipe>();
    const userId = c.get('userId'); // 从认证中间件获取

    const recipe = await recipeService.createRecipe({
      ...recipeData,
      created_by: userId,
    });

    return c.json(recipe, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 更新食谱
app.put('/:id', zValidator('json', createRecipeSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const recipeData = await c.req.json<Recipe>();

    // 检查权限
    const existingRecipe = await recipeService.getRecipeById(id);
    if (!existingRecipe) {
      return c.json({ error: '食谱不存在' }, 404);
    }
    if (existingRecipe.created_by !== userId) {
      return c.json({ error: '没有权限修改此食谱' }, 403);
    }

    const updatedRecipe = await recipeService.updateRecipe(id, recipeData);
    return c.json(updatedRecipe);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 删除食谱
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');

    // 检查权限
    const existingRecipe = await recipeService.getRecipeById(id);
    if (!existingRecipe) {
      return c.json({ error: '食谱不存在' }, 404);
    }
    if (existingRecipe.created_by !== userId) {
      return c.json({ error: '没有权限删除此食谱' }, 403);
    }

    await recipeService.deleteRecipe(id);
    return c.json({ message: '删除成功' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export { app as recipeRoutes };

// src/routes/recipe.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RecipeService } from '../services/recipe.service';
import type { Recipe, RecipeFilters } from '../types';
import { RecommendationService } from '../services/recommendation.service';
import { vectorRecommendationService } from '../services/vector-recommendation.service';
import { embeddingService } from '../services/embedding.service';
import { qdrantService } from '../services/qdrant.service';

// 创建Recipe服务实例
const recipeService = new RecipeService();
const recService = new RecommendationService();

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
  cookingTime: z.number().positive(),
  nutritionFacts: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
  }),
  cuisineType: z.array(z.string()),
  dietType: z.array(z.string()),
});

// 路由处理
const app = new Hono();

// 获取食谱列表
app.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    console.log('get recipes for user:', userId);
    
    // 解析查询参数
    const page = c.req.query('page') ? Number.parseInt(c.req.query('page') || '1') : 1;
    const limit = c.req.query('limit') ? Number.parseInt(c.req.query('limit') || '10') : 10;
    const cuisineType = c.req.query('cuisineType');
    const maxCookingTime = c.req.query('maxCookingTime') 
      ? Number.parseInt(c.req.query('maxCookingTime') || '') 
      : undefined;
    const dietType = c.req.query('dietType')?.split(',');
    const name = c.req.query('name');
    const minCalories = c.req.query('minCalories') 
      ? Number.parseInt(c.req.query('minCalories') || '') 
      : undefined;
    const maxCalories = c.req.query('maxCalories') 
      ? Number.parseInt(c.req.query('maxCalories') || '') 
      : undefined;
    const sortBy = c.req.query('sortBy') as RecipeFilters['sortBy'] || 'createdAt';
    const sortOrder = c.req.query('sortOrder') as RecipeFilters['sortOrder'] || 'desc';

    const filters: RecipeFilters = {
      page,
      limit,
      cuisineType,
      maxCookingTime,
      dietType,
      createdBy: userId,
      name,
      minCalories,
      maxCalories,
      sortBy,
      sortOrder
    };

    const result = await recipeService.getRecipes(filters);
    return c.json({
      success: true,
      data: {
        recipes: result.data,
        pagination: result.pagination
      }
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    }, 500);
  }
});

// 获取单个食谱
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const recipe = await recipeService.getRecipeById(id);

    if (!recipe) {
      return c.json({ 
        success: false, 
        error: {
          code: 'NOT_FOUND',
          message: '食谱不存在'
        }
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        recipe
      }
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    }, 500);
  }
});

// 创建新食谱
app.post('/', zValidator('json', createRecipeSchema), async (c) => {
  try {
    const recipeData = await c.req.json<Recipe>();
    const userId = c.get('userId');

    // 打印用户ID，用于调试
    console.log('Creating recipe with userId:', userId);

    const recipe = await recipeService.createRecipe({
      name: recipeData.name,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      steps: recipeData.steps,
      calories: recipeData.calories,
      cookingTime: recipeData.cookingTime,
      nutritionFacts: recipeData.nutritionFacts,
      cuisineType: recipeData.cuisineType,
      dietType: recipeData.dietType,
      createdBy: userId, // 确保这里的 userId 是 UUID 格式
      img: recipeData.img,
    });

    return c.json({
      success: true,
      message: 'Recipe created successfully',
      data: {
        recipe
      }
    }, 201);
  } catch (error: any) {
    console.error('Full error:', error); // 添加更详细的错误日志
    return c.json({ 
      success: false, 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    }, 500);
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
      return c.json({ 
        success: false, 
        error: {
          code: 'NOT_FOUND',
          message: '食谱不存在'
        }
      }, 404);
    }
    if (existingRecipe.createdBy !== userId) {
      return c.json({ 
        success: false, 
        error: {
          code: 'FORBIDDEN',
          message: '没有权限修改此食谱'
        }
      }, 403);
    }

    const updatedRecipe = await recipeService.updateRecipe(id, recipeData);
    return c.json({
      success: true,
      message: 'Recipe updated successfully',
      data: {
        recipe: updatedRecipe
      }
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    }, 500);
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
      return c.json({ 
        success: false, 
        error: {
          code: 'NOT_FOUND',
          message: '食谱不存在'
        }
      }, 404);
    }
    if (existingRecipe.createdBy !== userId) {
      return c.json({ 
        success: false, 
        error: {
          code: 'FORBIDDEN',
          message: '没有权限删除此食谱'
        }
      }, 403);
    }

    await recipeService.deleteRecipe(id);
    return c.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    }, 500);
  }
});

// 获取今日推荐接口
app.get('/recommendations/today', async (c) => {
  try {
    // 初始化向量数据库
    await qdrantService.initialize();
    
    const limit = Number.parseInt(c.req.query('limit') || '10');
    const page = Number.parseInt(c.req.query('page') || '1');
    const userId = c.req.query('userId');
    
    // 获取推荐
    const recommendations = await vectorRecommendationService.getDailyRecommendations({
      userId,
      limit,
      page
    });
    
    return c.json({
      success: true,
      ...recommendations
    });
  } catch (error: any) {
    console.error('获取今日推荐失败:', error);
    return c.json({
      success: false,
      message: '获取推荐失败',
      error: error.message
    }, 500);
  }
});

// 相似食谱查询接口
app.get('/recommendations/similar/:recipeId', async (c) => {
  try {
    const recipeId = c.req.param('recipeId');
    const limit = Number.parseInt(c.req.query('limit') || '5');
    
    if (!recipeId) {
      return c.json({ success: false, message: '未提供食谱ID' }, 400);
    }
    
    // 使用向量推荐服务获取相似食谱
    const recommendations = await vectorRecommendationService.getSimilarRecipes(recipeId, limit);
    
    return c.json({
      success: true,
      ...recommendations
    });
  } catch (error: any) {
    console.error('获取相似食谱失败:', error);
    return c.json({
      success: false,
      message: '获取相似食谱失败',
      error: error.message
    }, 500);
  }
});

export { app as recipeRoutes };

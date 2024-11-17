// src/services/recipe.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe, RecipeFilters } from '../types';
import { HTTPException } from 'hono/http-exception';
import { CacheService } from './cache.service';
import { createHash } from 'crypto';

export class RecipeService {
  private cacheService: CacheService;

  constructor(private supabase: SupabaseClient) {
    this.cacheService = new CacheService();
  }

  // 创建缓存键
  private createFilterHash(filters?: RecipeFilters): string {
    if (!filters) return 'all';
    return createHash('md5').update(JSON.stringify(filters)).digest('hex');
  }

  async getRecipes(filters?: RecipeFilters) {
    const cacheKey = this.createFilterHash(filters);

    try {
      // 尝试从缓存获取
      const cachedRecipes = await this.cacheService.getRecipeList(cacheKey);
      if (cachedRecipes) {
        return cachedRecipes;
      }

      // 如果缓存未命中，从数据库获取
      let query = this.supabase.from('recipes').select(`
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `);

      // 应用过滤条件
      if (filters) {
        if (filters.cuisineType) {
          query = query.eq('cuisine_type', filters.cuisineType);
        }
        if (filters.maxCookingTime) {
          query = query.lte('cooking_time', filters.maxCookingTime);
        }
        if (filters.dietType && filters.dietType.length > 0) {
          query = query.contains('diet_type', filters.dietType);
        }
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      // 存入缓存
      await this.cacheService.setRecipeList(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Get recipes error:', error);
      throw new HTTPException(500, { message: '获取食谱列表失败' });
    }
  }

  async getRecipeById(id: string) {
    try {
      // 尝试从缓存获取
      const cachedRecipe = await this.cacheService.getRecipe(id);
      if (cachedRecipe) {
        return cachedRecipe;
      }

      // 如果缓存未命中，从数据库获取
      const { data, error } = await this.supabase
        .from('recipes')
        .select(
          `
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      // 存入缓存
      await this.cacheService.setRecipe(data);

      return data;
    } catch (error) {
      console.error('Get recipe error:', error);
      throw new HTTPException(500, { message: '获取食谱详情失败' });
    }
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .insert(recipe)
        .select(
          `
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      // 清除食谱列表缓存
      await this.cacheService.clearByPrefix('recipe-list');

      return data;
    } catch (error) {
      console.error('Create recipe error:', error);
      throw new HTTPException(500, { message: '创建食谱失败' });
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>) {
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .update(recipe)
        .eq('id', id)
        .select(
          `
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      // 更新缓存
      await this.cacheService.setRecipe(data);
      // 清除食谱列表缓存
      await this.cacheService.clearByPrefix('recipe-list');

      return data;
    } catch (error) {
      console.error('Update recipe error:', error);
      throw new HTTPException(500, { message: '更新食谱失败' });
    }
  }

  async deleteRecipe(id: string) {
    try {
      const { error } = await this.supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 清除缓存
      await this.cacheService.invalidateRecipe(id);
      await this.cacheService.clearByPrefix('recipe-list');
    } catch (error) {
      console.error('Delete recipe error:', error);
      throw new HTTPException(500, { message: '删除食谱失败' });
    }
  }

  async searchRecipes(query: string) {
    try {
      // 尝试从缓存获取
      const cacheKey = `search:${query}`;
      const cachedResults = await this.cacheService.getRecipeList(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const { data, error } = await this.supabase
        .from('recipes')
        .select(
          `
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `
        )
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 存入缓存（搜索结果缓存时间较短）
      await this.cacheService.setRecipeList(cacheKey, data, 300); // 5分钟缓存

      return data;
    } catch (error) {
      console.error('Search recipes error:', error);
      throw new HTTPException(500, { message: '搜索食谱失败' });
    }
  }

  async getRecommendedRecipes(preferences: {
    dietType?: string[];
    cuisineType?: string[];
    maxCookingTime?: number;
    excludeIds?: string[];
  }) {
    try {
      // 创建推荐缓存键
      const cacheKey = `recommended:${this.createFilterHash(preferences)}`;

      // 尝试从缓存获取
      const cachedRecommendations = await this.cacheService.getRecipeList(
        cacheKey
      );
      if (cachedRecommendations) {
        return cachedRecommendations;
      }

      let query = this.supabase.from('recipes').select(`
          *,
          profiles:created_by (
            username,
            avatar_url
          )
        `);

      if (preferences.dietType?.length) {
        query = query.contains('diet_type', preferences.dietType);
      }

      if (preferences.cuisineType?.length) {
        query = query.in('cuisine_type', preferences.cuisineType);
      }

      if (preferences.maxCookingTime) {
        query = query.lte('cooking_time', preferences.maxCookingTime);
      }

      if (preferences.excludeIds?.length) {
        query = query.not('id', 'in', preferences.excludeIds);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // 存入缓存（推荐结果缓存时间适中）
      await this.cacheService.setRecipeList(cacheKey, data, 1800); // 30分钟缓存

      return data;
    } catch (error) {
      console.error('Get recommended recipes error:', error);
      throw new HTTPException(500, { message: '获取推荐食谱失败' });
    }
  }

  async getFavoriteRecipes(userId: string) {
    try {
      // 尝试从缓存获取
      const cacheKey = `favorites:${userId}`;
      const cachedFavorites = await this.cacheService.getRecipeList(cacheKey);
      if (cachedFavorites) {
        return cachedFavorites;
      }

      const { data, error } = await this.supabase
        .from('favorites')
        .select(
          `
          recipe_id,
          recipes:recipe_id (
            *,
            profiles:created_by (
              username,
              avatar_url
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recipes = data.map((item) => item.recipes);

      // 存入缓存
      await this.cacheService.setRecipeList(cacheKey, recipes);

      return recipes;
    } catch (error) {
      console.error('Get favorite recipes error:', error);
      throw new HTTPException(500, { message: '获取收藏食谱失败' });
    }
  }

  async getPopularRecipes() {
    try {
      const cacheKey = 'popular-recipes';

      // 尝试从缓存获取
      const cachedPopular = await this.cacheService.getRecipeList(cacheKey);
      if (cachedPopular) {
        return cachedPopular;
      }

      // 获取最近一周收藏最多的食谱
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await this.supabase
        .from('favorites')
        .select(
          `
          recipe_id,
          count(*),
          recipes:recipe_id (
            *,
            profiles:created_by (
              username,
              avatar_url
            )
          )
        `
        )
        .gte('created_at', oneWeekAgo.toISOString())
        .group('recipe_id')
        .order('count', { ascending: false })
        .limit(10);

      if (error) throw error;

      const recipes = data.map((item) => item.recipes);

      // 存入缓存（热门食谱缓存1小时）
      await this.cacheService.setRecipeList(cacheKey, recipes, 3600);

      return recipes;
    } catch (error) {
      console.error('Get popular recipes error:', error);
      throw new HTTPException(500, { message: '获取热门食谱失败' });
    }
  }
}

// src/services/cache.service.ts
import { Redis } from '@upstash/redis';
import { Recipe, MealPlan } from '../types';

export class CacheService {
  private redis: Redis;
  private DEFAULT_TTL = 60 * 60; // 1小时的缓存时间

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }

  // 生成缓存键
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // 设置缓存
  async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // 清除包含特定前缀的所有缓存
  async clearByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear by prefix error:', error);
    }
  }

  // 食谱相关的缓存方法
  async getRecipe(id: string): Promise<Recipe | null> {
    return this.get<Recipe>(this.generateKey('recipe', id));
  }

  async setRecipe(recipe: Recipe): Promise<void> {
    await this.set(this.generateKey('recipe', recipe.id), recipe);
  }

  async invalidateRecipe(id: string): Promise<void> {
    await this.del(this.generateKey('recipe', id));
  }

  // 食谱列表缓存
  async getRecipeList(key: string): Promise<Recipe[] | null> {
    return this.get<Recipe[]>(this.generateKey('recipe-list', key));
  }

  async setRecipeList(key: string, recipes: Recipe[]): Promise<void> {
    await this.set(this.generateKey('recipe-list', key), recipes);
  }

  // 膳食计划相关的缓存方法
  async getMealPlan(id: string): Promise<MealPlan | null> {
    return this.get<MealPlan>(this.generateKey('meal-plan', id));
  }

  async setMealPlan(mealPlan: MealPlan): Promise<void> {
    await this.set(this.generateKey('meal-plan', mealPlan.id), mealPlan);
  }

  async invalidateMealPlan(id: string): Promise<void> {
    await this.del(this.generateKey('meal-plan', id));
  }

  // 用户膳食计划列表缓存
  async getUserMealPlans(
    userId: string,
    dateKey: string
  ): Promise<MealPlan[] | null> {
    return this.get<MealPlan[]>(
      this.generateKey(`meal-plans:${userId}`, dateKey)
    );
  }

  async setUserMealPlans(
    userId: string,
    dateKey: string,
    mealPlans: MealPlan[]
  ): Promise<void> {
    await this.set(
      this.generateKey(`meal-plans:${userId}`, dateKey),
      mealPlans
    );
  }
}

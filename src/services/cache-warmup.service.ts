// src/services/cache-warmup.service.ts
import { CacheService } from './cache.service';
import { RecipeService } from './recipe.service';
import { MealPlanService } from './meal-plan.service';
import { SupabaseClient } from '@supabase/supabase-js';
// import {
//   CacheWarmupProgressService,
//   WarmupSession,
// } from './ache-warmup-progress.service';

export class CacheWarmupService {
  private cacheService: CacheService;
  private recipeService: RecipeService;
  private mealPlanService: MealPlanService;
  private isWarmingUp = false;
  private lastWarmupTime: Date | null = null;
  // private progressService: CacheWarmupProgressService;
  // private currentSession: WarmupSession | null = null;

  constructor(
    private supabase: SupabaseClient,
    private config: {
      warmupInterval: number; // 预热间隔，单位分钟
      popularRecipeCount: number; // 预热多少个热门食谱
      recentRecipeCount: number; // 预热多少个最新食谱
      popularCuisineTypes: string[]; // 热门菜系
    }
  ) {
    this.cacheService = new CacheService();
    this.recipeService = new RecipeService(supabase);
    this.mealPlanService = new MealPlanService(supabase);
    // this.progressService = new CacheWarmupProgressService();
  }

  // 检查是否需要预热
  private shouldWarmup(): boolean {
    if (this.isWarmingUp) return false;
    if (!this.lastWarmupTime) return true;

    const timeSinceLastWarmup = Date.now() - this.lastWarmupTime.getTime();
    return timeSinceLastWarmup > this.config.warmupInterval * 60 * 1000;
  }

  // 主预热流程
  async warmup() {
    if (!this.shouldWarmup()) {
      console.log('Skipping warmup - too soon or already in progress');
      return;
    }

    try {
      console.log('Starting cache warmup...');
      this.isWarmingUp = true;
      const startTime = Date.now();

      await Promise.all([
        this.warmupPopularRecipes(),
        this.warmupRecentRecipes(),
        this.warmupPopularCuisines(),
        this.warmupRecipeStats(),
      ]);

      const duration = Date.now() - startTime;
      this.lastWarmupTime = new Date();
      console.log(`Cache warmup completed in ${duration}ms`);
    } catch (error) {
      console.error('Cache warmup failed:', error);
    } finally {
      this.isWarmingUp = false;
    }
  }

  // 预热热门食谱
  private async warmupPopularRecipes() {
    try {
      console.log('Warming up popular recipes...');
      const { data: popularRecipes, error } = await this.supabase
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
        .group('recipe_id')
        .order('count', { ascending: false })
        .limit(this.config.popularRecipeCount);

      if (error) throw error;

      // 并行缓存所有热门食谱
      await Promise.all(
        popularRecipes.map(async (item) => {
          const recipe = item.recipes;
          if (recipe) {
            await this.cacheService.setRecipe(recipe);
            console.log(`Cached popular recipe: ${recipe.id}`);
          }
        })
      );

      // 缓存热门食谱列表
      await this.cacheService.setRecipeList(
        'popular-recipes',
        popularRecipes.map((item) => item.recipes),
        3600 // 1小时缓存
      );
    } catch (error) {
      console.error('Error warming up popular recipes:', error);
    }
  }

  // 预热最新食谱
  private async warmupRecentRecipes() {
    try {
      console.log('Warming up recent recipes...');
      const { data: recentRecipes, error } = await this.supabase
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
        .order('created_at', { ascending: false })
        .limit(this.config.recentRecipeCount);

      if (error) throw error;

      // 并行缓存所有最新食谱
      await Promise.all(
        recentRecipes.map((recipe) => this.cacheService.setRecipe(recipe))
      );

      // 缓存最新食谱列表
      await this.cacheService.setRecipeList(
        'recent-recipes',
        recentRecipes,
        1800 // 30分钟缓存
      );
    } catch (error) {
      console.error('Error warming up recent recipes:', error);
    }
  }

  // 预热热门菜系的食谱
  private async warmupPopularCuisines() {
    try {
      console.log('Warming up popular cuisine types...');
      await Promise.all(
        this.config.popularCuisineTypes.map(async (cuisineType) => {
          const { data: recipes, error } = await this.supabase
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
            .eq('cuisine_type', cuisineType)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          // 缓存该菜系的食谱列表
          await this.cacheService.setRecipeList(
            `cuisine:${cuisineType}`,
            recipes,
            3600 // 1小时缓存
          );
          console.log(`Cached recipes for cuisine type: ${cuisineType}`);
        })
      );
    } catch (error) {
      console.error('Error warming up cuisine types:', error);
    }
  }

  // 预热食谱统计数据
  private async warmupRecipeStats() {
    try {
      console.log('Warming up recipe statistics...');
      const stats = await Promise.all([
        // 总食谱数
        this.supabase.from('recipes').count(),
        // 各菜系食谱数量
        this.supabase
          .from('recipes')
          .select('cuisine_type, count(*)')
          .group('cuisine_type'),
        // 平均烹饪时间
        this.supabase
          .from('recipes')
          .select('cooking_time')
          .avg('cooking_time'),
      ]);

      await this.cacheService.set(
        'recipe-stats',
        {
          totalCount: stats[0].count,
          cuisineTypeCounts: stats[1].data,
          avgCookingTime: stats[2].data?.[0]?.avg,
        },
        7200 // 2小时缓存
      );
    } catch (error) {
      console.error('Error warming up recipe stats:', error);
    }
  }

  // 获取预热状态
  getWarmupStatus() {
    return {
      isWarmingUp: this.isWarmingUp,
      lastWarmupTime: this.lastWarmupTime,
      nextWarmupTime: this.lastWarmupTime
        ? new Date(
            this.lastWarmupTime.getTime() +
              this.config.warmupInterval * 60 * 1000
          )
        : null,
    };
  }
}

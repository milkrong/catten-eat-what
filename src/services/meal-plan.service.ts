// src/services/meal-plan.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { MealPlan } from '../types';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../types/supabase';
import { RecipeService } from './recipe.service';

export class MealPlanService {
  private recipeService: RecipeService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.recipeService = new RecipeService(supabase);
  }

  async getMealPlans(userId: string, startDate: Date, endDate: Date) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plans')
        .select(
          `
          *,
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
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get meal plans error:', error);
      throw new HTTPException(500, { message: '获取膳食计划失败' });
    }
  }

  async getMealPlanById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plans')
        .select(
          `
          *,
          recipes:recipe_id (
            *,
            profiles:created_by (
              username,
              avatar_url
            )
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get meal plan error:', error);
      throw new HTTPException(500, { message: '获取膳食计划详情失败' });
    }
  }

  async createMealPlan(
    mealPlan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plans')
        .insert(mealPlan)
        .select(
          `
          *,
          recipes:recipe_id (
            *,
            profiles:created_by (
              username,
              avatar_url
            )
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create meal plan error:', error);
      throw new HTTPException(500, { message: '创建膳食物计划失败' });
    }
  }

  async updateMealPlan(id: string, mealPlan: Partial<MealPlan>) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plans')
        .update(mealPlan)
        .eq('id', id)
        .select(
          `
          *,
          recipes:recipe_id (
            *,
            profiles:created_by (
              username,
              avatar_url
            )
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update meal plan error:', error);
      throw new HTTPException(500, { message: '更新膳食计划失败' });
    }
  }

  async deleteMealPlan(id: string) {
    try {
      const { error } = await this.supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete meal plan error:', error);
      throw new HTTPException(500, { message: '删除膳食计划失败' });
    }
  }

  async generateMealPlans(
    userId: string,
    startDate: Date,
    endDate: Date,
    preferences: {
      cuisine_type: string[];
      diet_type: string[];
      max_cooking_time?: number;
      calories_per_day?: number;
    }
  ) {
    try {
      // 计算需要生成的天数
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
      const mealPlans: MealPlan[] = [];

      // 获取已使用的食谱ID列表
      const usedRecipeIds: string[] = [];

      // 为每一天生成膳食计划
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);

        // 为每一餐生成推荐
        for (const mealType of mealTypes) {
          // 获取推荐食谱
          const recipes = await this.recipeService.getRecommendedRecipes({
            dietTypes: preferences.diet_type,
            cuisineTypes: preferences.cuisine_type,
            maxCookingTime: preferences.max_cooking_time,
            excludeIds: usedRecipeIds,
          });

          if (recipes.length === 0) {
            continue;
          }

          // 随机选择一个食谱
          const recipe = recipes[Math.floor(Math.random() * recipes.length)];
          usedRecipeIds.push(recipe.id);

          // 创建膳食计划
          if (!userId || !recipe.id) {
            throw new Error('Invalid user_id or recipe_id');
          }
          const mealPlan = await this.createMealPlan({
            user_id: userId,
            date: currentDate.toISOString(),
            meal_type: mealType,
            recipe_id: recipe.id,
          });

          mealPlans.push({
            ...mealPlan,
            user_id: userId,
            recipe_id: recipe.id,
          });
        }
      }

      return mealPlans;
    } catch (error) {
      console.error('Generate meal plans error:', error);
      throw new HTTPException(500, { message: '生成膳食计划失败' });
    }
  }
}

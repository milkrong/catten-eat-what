// src/services/recipe.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '../types/recipe';
import { RecipeFilters } from '../types/recipe';
import type { Database } from '../types/database';

interface RecommendationParams {
  dietTypes: string[];
  cuisineTypes: string[];
  maxCookingTime?: number;
  excludeIds?: string[];
}

export class RecipeService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    let query = this.supabase.from('recipes').select('*');

    // 应用过滤条件
    if (filters.cuisineType) {
      query = query.eq('cuisine_type', filters.cuisineType);
    }
    if (filters.maxCookingTime) {
      query = query.lte('cooking_time', filters.maxCookingTime);
    }
    if (filters.dietType && filters.dietType.length > 0) {
      query = query.contains('diet_type', filters.dietType);
    }

    // 应用默认限制
    query = query.limit(50); // 默认限制

    const { data, error } = await query;

    if (error) throw error;
    return data as Recipe[];
  }

  async getPopularRecipes(limit: number = 50): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('views', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Recipe[];
  }

  async getRecentRecipes(limit: number = 30): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Recipe[];
  }

  async getRecipesByCuisine(
    cuisineType: string,
    limit: number = 10
  ): Promise<Recipe[]> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('cuisine_type', cuisineType)
      .order('views', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Recipe[];
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const { data, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  async incrementViews(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_recipe_views', {
      recipe_id: id,
    });

    if (error) throw error;
  }

  async createRecipe(
    recipe: Omit<
      Recipe,
      'id' | 'created_at' | 'updated_at' | 'image_url' | 'views'
    >
  ): Promise<Recipe> {
    console.log('recipe', recipe);
    const { data, error } = await this.supabase
      .from('recipes')
      .insert([
        {
          ...recipe,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  async updateRecipe(
    id: string,
    updates: Partial<Omit<Recipe, 'id' | 'created_at' | 'created_by'>>
  ): Promise<Recipe> {
    const { data, error } = await this.supabase
      .from('recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  async deleteRecipe(id: string): Promise<void> {
    const { error } = await this.supabase.from('recipes').delete().eq('id', id);

    if (error) throw error;
  }

  async getRecommendedRecipes(params: RecommendationParams) {
    let query = this.supabase.from('recipes').select('*');

    if (params.maxCookingTime) {
      query = query.lte('cookingTime', params.maxCookingTime);
    }

    if (params.excludeIds?.length) {
      query = query.not('id', 'in', params.excludeIds);
    }

    const { data: recipes, error } = await query.limit(3);

    if (error) {
      throw error;
    }

    return recipes;
  }
}

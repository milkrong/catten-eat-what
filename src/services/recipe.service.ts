// src/services/recipe.service.ts
import { eq, lte, desc, and, not, inArray, sql } from 'drizzle-orm';
import { db } from '../config/db';
import { recipes } from '../db/schema';
import type { Recipe } from '../types/recipe';
import type { RecipeFilters } from '../types/recipe';

interface RecommendationParams {
  dietTypes: string[];
  cuisineTypes: string[];
  maxCookingTime?: number;
  excludeIds?: string[];
}

export class RecipeService {
  async getRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    const conditions = [];

    if (filters.cuisineType) {
      conditions.push(eq(recipes.cuisineType, filters.cuisineType));
    }
    if (filters.maxCookingTime) {
      conditions.push(lte(recipes.cookingTime, filters.maxCookingTime));
    }
    if (filters.dietType && filters.dietType.length > 0) {
      // Note: This is a simplification. You might need to adjust based on your exact needs
      conditions.push(eq(recipes.dietType, filters.dietType));
    }
    if (filters.createdBy) {
      conditions.push(eq(recipes.createdBy, filters.createdBy));
    }

    const result = await db.query.recipes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: 50,
    });

    return result as Recipe[];
  }

  async getPopularRecipes(limit: number = 50): Promise<Recipe[]> {
    const result = await db.query.recipes.findMany({
      orderBy: desc(recipes.views),
      limit,
    });

    return result as Recipe[];
  }

  async getRecentRecipes(limit: number = 30): Promise<Recipe[]> {
    const result = await db.query.recipes.findMany({
      orderBy: desc(recipes.createdAt),
      limit,
    });

    return result as Recipe[];
  }

  async getRecipesByCuisine(
    cuisineType: string,
    limit: number = 10
  ): Promise<Recipe[]> {
    const result = await db.query.recipes.findMany({
      where: eq(recipes.cuisineType, cuisineType),
      orderBy: desc(recipes.views),
      limit,
    });

    return result as Recipe[];
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const result = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
    });

    return result as Recipe | null;
  }

  async incrementViews(id: string): Promise<void> {
    await db
      .update(recipes)
      .set({
        views: sql`${recipes.views} + 1`,
      })
      .where(eq(recipes.id, id));
  }

  async createRecipe(
    recipe: Omit<
      Recipe,
      'id' | 'createdAt' | 'updatedAt' | 'views'
    >
  ): Promise<Recipe> {
    const [result] = await db
      .insert(recipes)
      .values({
        ...recipe,
        views: 0,
      })
      .returning();

    return result as Recipe;
  }

  async updateRecipe(
    id: string,
    updates: Partial<Omit<Recipe, 'id' | 'created_at' | 'created_by'>>
  ): Promise<Recipe> {
    const [result] = await db
      .update(recipes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id))
      .returning();

    return result as Recipe;
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async getRecommendedRecipes(params: RecommendationParams) {
    const conditions = [];

    if (params.maxCookingTime) {
      conditions.push(lte(recipes.cookingTime, params.maxCookingTime));
    }

    if (params.excludeIds?.length) {
      conditions.push(not(inArray(recipes.id, params.excludeIds)));
    }

    const result = await db.query.recipes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: 3,
    });

    return result;
  }
}

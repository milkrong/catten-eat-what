// src/services/recipe.service.ts
import { eq, lte, desc, and, not, inArray, sql, gte, like, asc } from 'drizzle-orm';
import { db } from '../config/db';
import { recipes } from '../db/schema';
import type { Recipe } from '../types/recipe';
import type { RecipeFilters, PaginatedResponse } from '../types/recipe';

interface RecommendationParams {
  dietTypes: string[];
  cuisineTypes: string[];
  maxCookingTime?: number;
  excludeIds?: string[];
}

export class RecipeService {
  async getRecipes(filters: RecipeFilters = {}): Promise<PaginatedResponse<Recipe>> {
    const conditions = [];
    const {
      page = 1,
      limit = 10,
      cuisineType,
      maxCookingTime,
      dietType,
      createdBy,
      name,
      minCalories,
      maxCalories,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // 应用过滤条件
    if (cuisineType) {
      conditions.push(eq(recipes.cuisineType, cuisineType));
    }
    if (maxCookingTime) {
      conditions.push(lte(recipes.cookingTime, maxCookingTime));
    }
    if (dietType && dietType.length > 0) {
      // 注意：这是一个简化。你可能需要根据你的确切需求进行调整
      conditions.push(eq(recipes.dietType, dietType));
    }
    if (createdBy) {
      conditions.push(eq(recipes.createdBy, createdBy));
    }
    if (name) {
      conditions.push(like(recipes.name, `%${name}%`));
    }
    if (minCalories) {
      conditions.push(gte(recipes.calories, minCalories));
    }
    if (maxCalories) {
      conditions.push(lte(recipes.calories, maxCalories));
    }

    // 计算总数
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = totalCountResult[0]?.count || 0;
    
    // 确定排序方式
    let orderByClause;
    if (sortBy === 'name') {
      orderByClause = sortOrder === 'asc' ? asc(recipes.name) : desc(recipes.name);
    } else if (sortBy === 'views') {
      orderByClause = sortOrder === 'asc' ? asc(recipes.views) : desc(recipes.views);
    } else if (sortBy === 'cookingTime') {
      orderByClause = sortOrder === 'asc' ? asc(recipes.cookingTime) : desc(recipes.cookingTime);
    } else if (sortBy === 'calories') {
      orderByClause = sortOrder === 'asc' ? asc(recipes.calories) : desc(recipes.calories);
    } else {
      // 默认按创建时间排序
      orderByClause = sortOrder === 'asc' ? asc(recipes.createdAt) : desc(recipes.createdAt);
    }

    // 获取分页数据
    const offset = (page - 1) * limit;
    const result = await db.query.recipes.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderByClause,
      limit: limit,
      offset: offset,
    });

    // 计算总页数
    const pages = Math.ceil(total / limit);

    return {
      data: result as Recipe[],
      pagination: {
        total,
        page,
        limit,
        pages,
      }
    };
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

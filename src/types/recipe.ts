// src/types/recipe.ts
import { Ingredient, Step, NutritionFacts } from './index';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  calories: number;
  cooking_time: number;
  nutrition_facts: NutritionFacts;
  cuisine_type: string;
  diet_type: string[];
  image_url?: string;
  created_by: string; // 添加 created_by 字段
  views?: number; // 添加可选的 views 字段
  created_at: string;
  updated_at: string;
}

export interface RecipeFilters {
  cuisineType?: string;
  maxCookingTime?: number;
  dietType?: string[];
}

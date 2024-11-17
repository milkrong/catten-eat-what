// src/types/index.ts
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
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Step {
  order: number;
  description: string;
}

export interface NutritionFacts {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  recipe?: Recipe;
  created_at: string;
  updated_at: string;
}

export interface RecipeFilters {
  cuisineType?: string;
  maxCookingTime?: number;
  dietType?: string[];
}

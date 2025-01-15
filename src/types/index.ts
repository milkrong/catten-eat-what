// src/types/index.ts
import { Recipe } from './recipe';
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

export * from './recipe';
export * from './supabase';
export * from './preferences';

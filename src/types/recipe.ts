import { InferModel } from 'drizzle-orm';
import { recipes } from '../db/schema';

export type Recipe = InferModel<typeof recipes>;
export type NewRecipe = InferModel<typeof recipes, 'insert'>;

export interface RecipeFilters {
  cuisineType?: string;
  maxCookingTime?: number;
  dietType?: string[];
  createdBy?: string;
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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

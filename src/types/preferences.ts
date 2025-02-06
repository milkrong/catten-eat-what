export type LLMService = "coze" | "deepseek" | "siliconflow" | "custom";

export interface DietaryPreferences {
  id: string;
  diet_type?: string[];
  cuisine_type?: string[];
  allergies?: string[];
  restrictions?: string[];
  calories_min?: number;
  calories_max?: number;
  max_cooking_time?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: "breakfast" | "lunch" | "dinner";
  excludeRecipes?: string[];
  provider?: LLMService;
  userId?: string;
}

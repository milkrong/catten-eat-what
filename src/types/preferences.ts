export interface DietaryPreferences {
  id: string;
  diet_type: string[] | null;
  cuisine_type: string[] | null;
  allergies: string[] | null;
  restrictions: string[] | null;
  calories_min: number | null;
  calories_max: number | null;
  max_cooking_time: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  excludeRecipes?: string[];
  provider?: 'dify' | 'coze' | 'ollama' | 'deepseek';
}

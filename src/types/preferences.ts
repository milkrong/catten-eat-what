export interface DietaryPreferences {
  diet_type: ('regular' | 'vegetarian' | 'vegan' | 'keto' | 'paleo')[];
  cuisine_type: string[];
  allergies: string[];
  restrictions: string[];
  target_calories: number;
  max_cooking_time: number;
  meals_per_day: number;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  excludeRecipes?: string[];
  provider?: 'dify' | 'coze' | 'ollama';
}

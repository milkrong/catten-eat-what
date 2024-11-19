export interface DietaryPreferences {
  dietType: 'regular' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  cuisineTypes: string[];
  allergies: string[];
  restrictions: string[];
  targetCalories: number;
  maxCookingTime: number;
  mealsPerDay: number;
}

export interface RecommendationRequest {
  preferences: DietaryPreferences;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  excludeRecipes?: string[];
}

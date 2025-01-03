export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          preferences: {
            dietTypes: string[];
            cuisineTypes: string[];
            allergies: string[];
            restrictions: string[];
            targetCalories: number;
            maxCookingTime: number;
          };
        };
        Insert: {
          id: string;
          preferences: {
            dietTypes: string[];
            cuisineTypes: string[];
            allergies: string[];
            restrictions: string[];
            targetCalories: number;
            maxCookingTime: number;
          };
        };
        Update: {
          id?: string;
          preferences?: {
            dietTypes: string[];
            cuisineTypes: string[];
            allergies: string[];
            restrictions: string[];
            targetCalories: number;
            maxCookingTime: number;
          };
        };
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: MealType;
          recipe_id: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          meal_type: MealType;
          recipe_id: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          meal_type?: MealType;
          recipe_id?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          ingredients: Array<{
            name: string;
            amount: number;
            unit: string;
          }>;
          calories: number;
          cookingTime: number;
          nutrition: {
            protein: number;
            fat: number;
            carbs: number;
            fiber: number;
          };
          steps: string[];
        };
        Insert: {
          id?: string;
          name: string;
          ingredients: Array<{
            name: string;
            amount: number;
            unit: string;
          }>;
          calories: number;
          cookingTime: number;
          nutrition: {
            protein: number;
            fat: number;
            carbs: number;
            fiber: number;
          };
          steps: string[];
        };
        Update: {
          id?: string;
          name?: string;
          ingredients?: Array<{
            name: string;
            amount: number;
            unit: string;
          }>;
          calories?: number;
          cookingTime?: number;
          nutrition?: {
            protein: number;
            fat: number;
            carbs: number;
            fiber: number;
          };
          steps?: string[];
        };
      };
    };
  };
}

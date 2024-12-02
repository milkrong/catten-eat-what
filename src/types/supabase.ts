export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string | null;
          id: string;
          recipe_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          recipe_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          recipe_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      meal_plans: {
        Row: {
          created_at: string | null;
          date: string;
          id: string;
          meal_type: string;
          recipe_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          id?: string;
          meal_type: string;
          recipe_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          id?: string;
          meal_type?: string;
          recipe_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_plans_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_plans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      preferences: {
        Row: {
          allergies: string[] | null;
          calories_max: number | null;
          calories_min: number | null;
          created_at: string | null;
          diet_type: string[] | null;
          id: string;
          max_cooking_time: number | null;
          restrictions: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          allergies?: string[] | null;
          calories_max?: number | null;
          calories_min?: number | null;
          created_at?: string | null;
          diet_type?: string[] | null;
          id: string;
          max_cooking_time?: number | null;
          restrictions?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          allergies?: string[] | null;
          calories_max?: number | null;
          calories_min?: number | null;
          created_at?: string | null;
          diet_type?: string[] | null;
          id?: string;
          max_cooking_time?: number | null;
          restrictions?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'preferences_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          calories: number | null;
          cooking_time: number | null;
          created_at: string | null;
          created_by: string | null;
          cuisine_type: string | null;
          description: string | null;
          diet_type: string[] | null;
          id: string;
          image_url: string | null;
          ingredients: Json | null;
          name: string;
          nutrition_facts: Json | null;
          steps: Json | null;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          calories?: number | null;
          cooking_time?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          diet_type?: string[] | null;
          id?: string;
          image_url?: string | null;
          ingredients?: Json | null;
          name: string;
          nutrition_facts?: Json | null;
          steps?: Json | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          calories?: number | null;
          cooking_time?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          diet_type?: string[] | null;
          id?: string;
          image_url?: string | null;
          ingredients?: Json | null;
          name?: string;
          nutrition_facts?: Json | null;
          steps?: Json | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          clerk_id: string;
          created_at: string | null;
          email: string | null;
          id: number;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          clerk_id: string;
          created_at?: string | null;
          email?: string | null;
          id?: number;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          clerk_id?: string;
          created_at?: string | null;
          email?: string | null;
          id?: number;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_recipe_views: {
        Args: {
          recipe_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

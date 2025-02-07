import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, date } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients'),
  steps: jsonb('steps'),
  calories: integer('calories'),
  cookingTime: integer('cooking_time'),
  nutritionFacts: jsonb('nutrition_facts'),
  cuisineType: text('cuisine_type'),
  dietType: text('diet_type').array(),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  views: integer('views').default(0),
  img: text('img')
});

export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  mealType: text('meal_type').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const preferences = pgTable('preferences', {
  id: uuid('id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  dietType: text('diet_type').array(),
  restrictions: text('restrictions').array(),
  allergies: text('allergies').array(),
  caloriesMin: integer('calories_min'),
  caloriesMax: integer('calories_max'),
  maxCookingTime: integer('max_cooking_time'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  cuisineType: text('cuisine_type').array(),
  mealsPerDay: integer('meals_per_day')
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id).unique().notNull(),
  llmService: text('llm_service').notNull(),
  modelName: text('model_name'),
  isPaid: boolean('is_paid').default(true),
  apiKey: text('api_key'),
  apiEndpoint: text('api_endpoint'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 
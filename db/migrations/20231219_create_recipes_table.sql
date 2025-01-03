-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB,
  steps JSONB,
  cuisine_type TEXT,
  diet_type TEXT[],
  cooking_time INTEGER,
  calories INTEGER,
  nutrition_facts JSONB,
  image_url TEXT,
  created_by TEXT REFERENCES users(clerk_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS recipes_created_by_idx ON recipes(created_by);
CREATE INDEX IF NOT EXISTS recipes_cuisine_type_idx ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes(created_at);

-- Create trigger to update updated_at
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
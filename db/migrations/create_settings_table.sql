-- SQL migration for creating the user settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
    llm_service text NOT NULL CHECK (llm_service IN ('deepseek', 'coze', 'siliconflow')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
); 
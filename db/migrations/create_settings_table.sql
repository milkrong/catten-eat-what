-- SQL migration for creating the user settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
    llm_service text NOT NULL CHECK (llm_service IN ('deepseek', 'coze', 'siliconflow', 'custom')),
    model_name text,
    is_paid boolean DEFAULT false,
    api_key text,
    api_endpoint text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Add constraints to ensure custom service has required fields
    CONSTRAINT custom_service_config CHECK (
        (llm_service != 'custom') OR 
        (llm_service = 'custom' AND model_name IS NOT NULL AND api_key IS NOT NULL AND api_endpoint IS NOT NULL)
    )
); 
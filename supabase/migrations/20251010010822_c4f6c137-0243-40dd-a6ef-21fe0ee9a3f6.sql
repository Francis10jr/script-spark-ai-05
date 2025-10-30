-- Add missing tables from mvp_roteirista schema

-- Create characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  role varchar,
  description text,
  age varchar,
  gender varchar,
  actor_name varchar,
  costume_notes text,
  makeup_notes text,
  character_arc text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS public.scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_number integer NOT NULL,
  int_ext varchar,
  location varchar,
  time_of_day varchar,
  description text,
  characters text[],
  props text[],
  estimated_duration integer,
  order_position integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type varchar NOT NULL,
  content text,
  version integer DEFAULT 1,
  source varchar DEFAULT 'ai_generated',
  file_name varchar,
  file_url text,
  word_count integer,
  page_count integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create storyboards table
CREATE TABLE IF NOT EXISTS public.storyboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id uuid NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  frame_number integer NOT NULL,
  image_url text,
  image_prompt text,
  description text,
  camera_angle varchar,
  camera_movement varchar,
  created_at timestamp with time zone DEFAULT now()
);

-- Create technical_breakdown table
CREATE TABLE IF NOT EXISTS public.technical_breakdown (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id uuid NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  shot_number varchar,
  shot_type varchar,
  framing varchar,
  movement varchar,
  lens varchar,
  equipment text[],
  lighting_setup text,
  sound_notes text,
  vfx_notes text,
  estimated_setup_time integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category varchar NOT NULL,
  subcategory varchar,
  item_name varchar NOT NULL,
  description text,
  quantity numeric DEFAULT 1,
  unit varchar DEFAULT 'unidade',
  unit_price numeric DEFAULT 0,
  total_price numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  currency varchar DEFAULT 'BRL',
  supplier varchar,
  contact text,
  status varchar DEFAULT 'estimated',
  payment_method varchar,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_type varchar NOT NULL,
  input_prompt text,
  output_content text,
  tokens_used integer,
  model_used varchar,
  provider varchar,
  status varchar DEFAULT 'completed',
  error_message text,
  processing_time_ms integer,
  cost numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_usage table
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan varchar DEFAULT 'free',
  ai_generations_used integer DEFAULT 0,
  ai_generations_limit integer DEFAULT 10,
  projects_count integer DEFAULT 0,
  projects_limit integer DEFAULT 1,
  storage_used_mb numeric DEFAULT 0,
  storage_limit_mb numeric DEFAULT 100,
  plan_started_at timestamp with time zone DEFAULT now(),
  plan_expires_at timestamp with time zone,
  next_reset_date date DEFAULT (CURRENT_DATE + interval '1 month'),
  is_active boolean DEFAULT true,
  stripe_customer_id varchar,
  stripe_subscription_id varchar,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characters
CREATE POLICY "Users can view own project characters"
  ON public.characters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project characters"
  ON public.characters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project characters"
  ON public.characters FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project characters"
  ON public.characters FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = characters.project_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for scenes
CREATE POLICY "Users can view own project scenes"
  ON public.scenes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project scenes"
  ON public.scenes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project scenes"
  ON public.scenes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project scenes"
  ON public.scenes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scenes.project_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for scripts
CREATE POLICY "Users can view own project scripts"
  ON public.scripts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scripts.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scripts.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project scripts"
  ON public.scripts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scripts.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project scripts"
  ON public.scripts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scripts.project_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for storyboards
CREATE POLICY "Users can view own project storyboards"
  ON public.storyboards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = storyboards.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project storyboards"
  ON public.storyboards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = storyboards.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project storyboards"
  ON public.storyboards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = storyboards.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project storyboards"
  ON public.storyboards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = storyboards.scene_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for technical_breakdown
CREATE POLICY "Users can view own project technical breakdown"
  ON public.technical_breakdown FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = technical_breakdown.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project technical breakdown"
  ON public.technical_breakdown FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = technical_breakdown.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project technical breakdown"
  ON public.technical_breakdown FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = technical_breakdown.scene_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project technical breakdown"
  ON public.technical_breakdown FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.scenes
    JOIN public.projects ON projects.id = scenes.project_id
    WHERE scenes.id = technical_breakdown.scene_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for budget_items
CREATE POLICY "Users can view own project budget items"
  ON public.budget_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = budget_items.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project budget items"
  ON public.budget_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = budget_items.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project budget items"
  ON public.budget_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = budget_items.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project budget items"
  ON public.budget_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = budget_items.project_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for ai_generations
CREATE POLICY "Users can view own ai generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai generations"
  ON public.ai_generations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai generations"
  ON public.ai_generations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_usage
CREATE POLICY "Users can view own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.user_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.user_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON public.scenes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_technical_breakdown_updated_at
  BEFORE UPDATE ON public.technical_breakdown
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
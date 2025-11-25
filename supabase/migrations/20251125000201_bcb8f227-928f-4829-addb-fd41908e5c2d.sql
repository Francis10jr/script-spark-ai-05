-- Add workflow_type column to projects table
ALTER TABLE public.projects
ADD COLUMN workflow_type TEXT CHECK (workflow_type IN ('ai', 'upload'));

COMMENT ON COLUMN public.projects.workflow_type IS 'Tipo de workflow escolhido: ai (gerar tudo com IA) ou upload (importar roteiro pronto)';
-- Fix security issue: Recreate writing_prompts view without SECURITY DEFINER
-- This ensures the view uses the querying user's permissions rather than the creator's

DROP VIEW IF EXISTS public.writing_prompts;

-- Recreate the view without SECURITY DEFINER to follow security best practices
CREATE VIEW public.writing_prompts AS
SELECT
  id,
  system_type,
  grade_level,
  subject,
  question_text,
  question_type,
  difficulty_level,
  points,
  created_at,
  updated_at
FROM public.questions
WHERE question_type = 'essay';

-- Add comment for clarity
COMMENT ON VIEW public.writing_prompts IS 'View of essay questions from questions table. Inherits RLS policies from questions table.';
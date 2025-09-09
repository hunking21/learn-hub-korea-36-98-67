-- Insert a sample math question into the Math table
INSERT INTO public."Math" (
  system_type,
  grade_level,
  subject,
  question_text,
  question_type,
  options,
  correct_answer,
  explanation,
  points,
  difficulty_level
) VALUES (
  'korea',
  '초3',
  'Math',
  '9 × 7은 얼마인가요?',
  'multiple_choice',
  '["56", "63", "72", "81"]'::jsonb,
  '63',
  '9에 7을 곱하면 63입니다. 구구단을 이용하면 쉽게 계산할 수 있습니다.',
  3,
  2
);
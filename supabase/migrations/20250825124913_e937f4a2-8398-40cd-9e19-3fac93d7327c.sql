-- Create reading_passages table
CREATE TABLE public.reading_passages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  system_type TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  passage_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_questions table
CREATE TABLE public.reading_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay')),
  options JSONB,
  correct_answer TEXT,
  sample_answer TEXT,
  explanation TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 1,
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_test_sessions table
CREATE TABLE public.reading_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  system_type TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_possible_score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_test_answers table
CREATE TABLE public.reading_test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.reading_test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.reading_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_test_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reading_passages
CREATE POLICY "Public can read reading passages"
ON public.reading_passages
FOR SELECT
USING (true);

-- Create RLS policies for reading_questions
CREATE POLICY "Public can read reading questions"
ON public.reading_questions
FOR SELECT
USING (true);

-- Create RLS policies for reading_test_sessions
CREATE POLICY "Sessions can be viewed by owner-or-anon"
ON public.reading_test_sessions
FOR SELECT
USING ((user_id = auth.uid()) OR (user_id IS NULL));

CREATE POLICY "Sessions can be inserted by owner-or-anon"
ON public.reading_test_sessions
FOR INSERT
WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));

CREATE POLICY "Sessions can be updated by owner-or-anon"
ON public.reading_test_sessions
FOR UPDATE
USING ((user_id = auth.uid()) OR (user_id IS NULL));

-- Create RLS policies for reading_test_answers
CREATE POLICY "Answers can be viewed if session is owner-or-anon"
ON public.reading_test_answers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM reading_test_sessions s
  WHERE s.id = reading_test_answers.session_id
  AND ((s.user_id = auth.uid()) OR (s.user_id IS NULL))
));

CREATE POLICY "Answers can be inserted if session is owner-or-anon"
ON public.reading_test_answers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM reading_test_sessions s
  WHERE s.id = reading_test_answers.session_id
  AND ((s.user_id = auth.uid()) OR (s.user_id IS NULL))
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reading_passages_updated_at
  BEFORE UPDATE ON public.reading_passages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_questions_updated_at
  BEFORE UPDATE ON public.reading_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_test_sessions_updated_at
  BEFORE UPDATE ON public.reading_test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_reading_questions_passage_id ON public.reading_questions(passage_id);
CREATE INDEX idx_reading_questions_order ON public.reading_questions(passage_id, question_order);
CREATE INDEX idx_reading_test_sessions_user_id ON public.reading_test_sessions(user_id);
CREATE INDEX idx_reading_test_sessions_passage_id ON public.reading_test_sessions(passage_id);
CREATE INDEX idx_reading_test_answers_session_id ON public.reading_test_answers(session_id);
CREATE INDEX idx_reading_test_answers_question_id ON public.reading_test_answers(question_id);

-- Create a view for reading passages with question counts
CREATE VIEW public.reading_passages_with_stats AS
SELECT 
  p.*,
  COUNT(q.id) as question_count,
  COALESCE(SUM(q.points), 0) as total_points
FROM public.reading_passages p
LEFT JOIN public.reading_questions q ON p.id = q.passage_id
GROUP BY p.id, p.title, p.content, p.system_type, p.grade_level, p.subject, p.difficulty_level, p.passage_type, p.created_at, p.updated_at;
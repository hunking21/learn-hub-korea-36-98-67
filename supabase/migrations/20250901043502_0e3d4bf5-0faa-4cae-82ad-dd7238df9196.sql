-- Create test masters table (시험 종류)
CREATE TABLE public.test_masters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test versions table (학년별 시험 버전)
CREATE TABLE public.test_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id UUID NOT NULL REFERENCES public.test_masters(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  system_type TEXT NOT NULL,
  time_limit_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test sections table (섹션 구성)
CREATE TABLE public.test_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL REFERENCES public.test_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  score_weight DECIMAL(5,2) DEFAULT 100.0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test section questions table (섹션별 문제)
CREATE TABLE public.test_section_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.test_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_section_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Test masters policies
CREATE POLICY "Everyone can view test masters" 
ON public.test_masters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage test masters" 
ON public.test_masters 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN user_sessions s ON u.id = s.user_id 
  WHERE s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token') 
  AND s.expires_at > now() 
  AND u.role = 'admin'
));

-- Test versions policies
CREATE POLICY "Everyone can view test versions" 
ON public.test_versions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage test versions" 
ON public.test_versions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN user_sessions s ON u.id = s.user_id 
  WHERE s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token') 
  AND s.expires_at > now() 
  AND u.role = 'admin'
));

-- Test sections policies
CREATE POLICY "Everyone can view test sections" 
ON public.test_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage test sections" 
ON public.test_sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN user_sessions s ON u.id = s.user_id 
  WHERE s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token') 
  AND s.expires_at > now() 
  AND u.role = 'admin'
));

-- Test section questions policies
CREATE POLICY "Everyone can view test section questions" 
ON public.test_section_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage test section questions" 
ON public.test_section_questions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN user_sessions s ON u.id = s.user_id 
  WHERE s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token') 
  AND s.expires_at > now() 
  AND u.role = 'admin'
));

-- Create triggers for updated_at
CREATE TRIGGER update_test_masters_updated_at
  BEFORE UPDATE ON public.test_masters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_versions_updated_at
  BEFORE UPDATE ON public.test_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_sections_updated_at
  BEFORE UPDATE ON public.test_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_section_questions_updated_at
  BEFORE UPDATE ON public.test_section_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_test_versions_master_id ON public.test_versions(master_id);
CREATE INDEX idx_test_sections_version_id ON public.test_sections(version_id);
CREATE INDEX idx_test_section_questions_section_id ON public.test_section_questions(section_id);
CREATE INDEX idx_test_sections_order ON public.test_sections(version_id, order_index);
CREATE INDEX idx_test_section_questions_order ON public.test_section_questions(section_id, order_index);
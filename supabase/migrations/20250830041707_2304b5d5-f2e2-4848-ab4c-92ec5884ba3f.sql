-- Create missing tables that the application expects

-- Create profiles table (for teacher management)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table (for test data seeding)
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_type TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options TEXT[],
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_passages table
CREATE TABLE public.reading_passages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  grade_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_questions table
CREATE TABLE public.reading_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passage_id UUID NOT NULL REFERENCES reading_passages(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options TEXT[],
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_test_sessions table
CREATE TABLE public.reading_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id UUID NOT NULL REFERENCES reading_passages(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create reading_answers table
CREATE TABLE public.reading_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES reading_test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES reading_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role = 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now()));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role = 'admin'));

-- Create RLS policies for questions (public read, admin write)
CREATE POLICY "Everyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role = 'admin'));

-- Create RLS policies for reading passages (public read, admin write)
CREATE POLICY "Everyone can view reading passages" ON public.reading_passages FOR SELECT USING (true);
CREATE POLICY "Admins can manage reading passages" ON public.reading_passages FOR ALL USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role = 'admin'));

-- Create RLS policies for reading questions (public read, admin write)
CREATE POLICY "Everyone can view reading questions" ON public.reading_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage reading questions" ON public.reading_questions FOR ALL USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role = 'admin'));

-- Create RLS policies for reading test sessions (users can manage own sessions)
CREATE POLICY "Users can view own test sessions" ON public.reading_test_sessions FOR SELECT USING (user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now()));
CREATE POLICY "Users can create own test sessions" ON public.reading_test_sessions FOR INSERT WITH CHECK (user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now()));
CREATE POLICY "Users can update own test sessions" ON public.reading_test_sessions FOR UPDATE USING (user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now()));
CREATE POLICY "Teachers and admins can view all sessions" ON public.reading_test_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role IN ('teacher', 'admin')));

-- Create RLS policies for reading answers (users can manage own answers)
CREATE POLICY "Users can view own answers" ON public.reading_answers FOR SELECT USING (EXISTS (SELECT 1 FROM reading_test_sessions rts WHERE rts.id = session_id AND rts.user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now())));
CREATE POLICY "Users can create own answers" ON public.reading_answers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reading_test_sessions rts WHERE rts.id = session_id AND rts.user_id = (SELECT user_id FROM user_sessions WHERE session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND expires_at > now())));
CREATE POLICY "Teachers and admins can view all answers" ON public.reading_answers FOR SELECT USING (EXISTS (SELECT 1 FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text) AND s.expires_at > now() AND u.role IN ('teacher', 'admin')));

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
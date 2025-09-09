-- AI 테스트 시스템을 위한 데이터베이스 테이블 생성

-- 1. 테스트 문제 테이블
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL CHECK (subject IN ('국어', '수학', '영어')),
  system_type TEXT NOT NULL CHECK (system_type IN ('korea', 'us', 'uk')),
  grade_level TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay')),
  options JSONB, -- 객관식 선택지 저장 (배열 형태)
  correct_answer TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  points INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. 테스트 세션 테이블 (사용자별 테스트 기록)
CREATE TABLE public.test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL UNIQUE, -- 임시 세션 식별자 (로그인 없이)
  subject TEXT NOT NULL CHECK (subject IN ('국어', '수학', '영어')),
  system_type TEXT NOT NULL CHECK (system_type IN ('korea', 'us', 'uk')),
  grade_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  total_questions INTEGER,
  current_question_index INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_score INTEGER DEFAULT 0,
  max_possible_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. 테스트 답안 테이블
CREATE TABLE public.test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  time_spent INTEGER, -- 문제 풀이에 소요된 시간 (초)
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- 4. 테스트 결과 분석 테이블
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER NOT NULL,
  percentage_score DECIMAL(5,2) NOT NULL,
  grade_rating TEXT, -- A+, A, B+, B, C+, C, D+, D, F
  strengths TEXT[], -- 강점 영역들
  weaknesses TEXT[], -- 약점 영역들
  recommendations TEXT[], -- 추천 학습 방향
  time_analysis JSONB, -- 시간 분석 데이터
  difficulty_analysis JSONB, -- 난이도별 성과 분석
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. 학습 추천 테이블
CREATE TABLE public.learning_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL CHECK (subject IN ('국어', '수학', '영어')),
  system_type TEXT NOT NULL CHECK (system_type IN ('korea', 'us', 'uk')),
  grade_level TEXT NOT NULL,
  weakness_area TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  study_materials JSONB, -- 추천 학습 자료 링크들
  priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Row Level Security 활성화 (공개 테스트이므로 모든 사용자가 접근 가능)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

-- 공개 접근 정책 생성 (로그인 없이 사용 가능)
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read learning recommendations" ON public.learning_recommendations FOR SELECT USING (true);

-- 테스트 세션 정책 (세션 키로 구분)
CREATE POLICY "Anyone can create test sessions" ON public.test_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their own test sessions" ON public.test_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can update their own test sessions" ON public.test_sessions FOR UPDATE USING (true);

-- 테스트 답안 정책
CREATE POLICY "Anyone can manage test answers" ON public.test_answers FOR ALL USING (true);

-- 테스트 결과 정책
CREATE POLICY "Anyone can manage test results" ON public.test_results FOR ALL USING (true);

-- 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_sessions_updated_at
  BEFORE UPDATE ON public.test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_questions_subject_system_grade ON public.questions(subject, system_type, grade_level);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_test_sessions_session_key ON public.test_sessions(session_key);
CREATE INDEX idx_test_sessions_status ON public.test_sessions(status);
CREATE INDEX idx_test_answers_session_question ON public.test_answers(session_id, question_id);
CREATE INDEX idx_learning_recommendations_lookup ON public.learning_recommendations(subject, system_type, grade_level);

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO public.questions (subject, system_type, grade_level, question_text, question_type, options, correct_answer, difficulty_level, points, explanation) VALUES
  ('수학', 'korea', '초1', '3 + 2 = ?', 'multiple_choice', '["3", "4", "5", "6"]', '5', 1, 1, '3과 2를 더하면 5입니다.'),
  ('수학', 'korea', '초1', '5 - 1 = ?', 'multiple_choice', '["3", "4", "5", "6"]', '4', 1, 1, '5에서 1을 빼면 4입니다.'),
  ('국어', 'korea', '초1', '다음 중 올바른 맞춤법은?', 'multiple_choice', '["안녕하세요", "안뇽하세요", "안념하세요", "안뇽하새요"]', '안녕하세요', 2, 1, '올바른 맞춤법은 "안녕하세요"입니다.'),
  ('영어', 'korea', '초1', 'What color is the sun?', 'multiple_choice', '["Red", "Blue", "Yellow", "Green"]', 'Yellow', 1, 1, 'The sun appears yellow in color.'),
  ('수학', 'us', 'Grade 1', '4 + 3 = ?', 'multiple_choice', '["6", "7", "8", "9"]', '7', 1, 1, '4 plus 3 equals 7.');

INSERT INTO public.learning_recommendations (subject, system_type, grade_level, weakness_area, recommendation_text, study_materials, priority_level) VALUES
  ('수학', 'korea', '초1', '덧셈', '기초 덧셈 연습이 필요합니다. 손가락이나 도구를 활용해 시각적으로 학습해보세요.', '{"videos": ["https://example.com/addition"], "worksheets": ["basic_addition.pdf"]}', 5),
  ('국어', 'korea', '초1', '맞춤법', '기본 맞춤법 규칙을 익히고 많은 글을 읽어보세요.', '{"books": ["기초 맞춤법"], "apps": ["맞춤법 연습 앱"]}', 4),
  ('영어', 'korea', '초1', '기초단어', '일상생활 영어 단어부터 차근차근 익혀보세요.', '{"flashcards": ["기초 영단어"], "games": ["영어 단어 게임"]}', 3);
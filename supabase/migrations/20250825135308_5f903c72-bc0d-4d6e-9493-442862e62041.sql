-- 6학년 리딩 데이터를 다양한 학년제에 복제하여 진단테스트에서 사용할 수 있도록 함

-- 먼저 기존 6학년 데이터를 확인
SELECT id, title, system_type, grade_level, subject FROM reading_passages WHERE grade_level = '6학년';

-- 한국 학년제용 데이터 업데이트 (이미 존재하는 데이터)
UPDATE reading_passages 
SET grade_level = '초6' 
WHERE grade_level = '6학년' AND system_type = 'korea';

-- 미국 학년제용 데이터 복제
INSERT INTO reading_passages (title, content, system_type, grade_level, subject, difficulty_level, passage_type)
SELECT 
  title,
  content,
  'us' as system_type,
  'Grade6' as grade_level,
  subject,
  difficulty_level,
  passage_type
FROM reading_passages 
WHERE system_type = 'korea' AND grade_level = '초6';

-- 영국 학년제용 데이터 복제  
INSERT INTO reading_passages (title, content, system_type, grade_level, subject, difficulty_level, passage_type)
SELECT 
  title,
  content,
  'uk' as system_type,
  'Y7' as grade_level,
  subject,
  difficulty_level,
  passage_type
FROM reading_passages 
WHERE system_type = 'korea' AND grade_level = '초6';

-- 각 passage에 대한 reading_questions도 복제
-- 먼저 미국 학년제용 reading_questions 복제
INSERT INTO reading_questions (passage_id, question_text, question_type, options, correct_answer, sample_answer, explanation, points, difficulty_level, question_order)
SELECT 
  us_passages.id as passage_id,
  rq.question_text,
  rq.question_type,
  rq.options,
  rq.correct_answer,
  rq.sample_answer,
  rq.explanation,
  rq.points,
  rq.difficulty_level,
  rq.question_order
FROM reading_questions rq
JOIN reading_passages korea_passages ON rq.passage_id = korea_passages.id
JOIN reading_passages us_passages ON (
  korea_passages.title = us_passages.title 
  AND us_passages.system_type = 'us' 
  AND us_passages.grade_level = 'Grade6'
)
WHERE korea_passages.system_type = 'korea' AND korea_passages.grade_level = '초6';

-- 영국 학년제용 reading_questions 복제
INSERT INTO reading_questions (passage_id, question_text, question_type, options, correct_answer, sample_answer, explanation, points, difficulty_level, question_order)
SELECT 
  uk_passages.id as passage_id,
  rq.question_text,
  rq.question_type,
  rq.options,
  rq.correct_answer,
  rq.sample_answer,
  rq.explanation,
  rq.points,
  rq.difficulty_level,
  rq.question_order
FROM reading_questions rq
JOIN reading_passages korea_passages ON rq.passage_id = korea_passages.id
JOIN reading_passages uk_passages ON (
  korea_passages.title = uk_passages.title 
  AND uk_passages.system_type = 'uk' 
  AND uk_passages.grade_level = 'Y7'
)
WHERE korea_passages.system_type = 'korea' AND korea_passages.grade_level = '초6';

-- 6학년(등가) 라이팅 프롬프트 삽입
-- 기존 UI는 subject='English' AND question_type='essay'로 가져오므로,
-- 아래 데이터는 /test/start?exam=English%20Writing 선택 시 자동 연동됩니다.

insert into public.questions (
  question_type, question_text, options, correct_answer, explanation,
  points, difficulty_level, system_type, grade_level, subject
)
values
  -- 한국 학제: 초6
  (
    'essay',
    'Creative Essay - Meeting myself in the future...',
    null,
    null,
    'Narrative/creative essay for Grade 6 level. Focus on organization, detail, and future-tense expressions.',
    10,
    3,
    'korea',
    '초6',
    'English'
  ),
  -- 미국 학제: Grade 6
  (
    'essay',
    'Creative Essay - Meeting myself in the future...',
    null,
    null,
    'Narrative/creative essay for Grade 6 level. Focus on organization, detail, and future-tense expressions.',
    10,
    3,
    'us',
    'Grade 6',
    'English'
  ),
  -- 영국 학제: Year 7 (대략적인 등가)
  (
    'essay',
    'Creative Essay - Meeting myself in the future...',
    null,
    null,
    'Narrative/creative essay for Year 7 level. Focus on organization, detail, and future-tense expressions.',
    10,
    3,
    'uk',
    'Year 7',
    'English'
  );

-- 질문 유형과 과목 제약조건을 업데이트
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_subject_check;
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions ADD CONSTRAINT questions_subject_check 
CHECK (subject IN ('국어', '수학', '영어', 'reading', 'writing', 'speaking', 'math'));

ALTER TABLE questions ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'speaking'));

-- 진단테스트용 문제들을 추가 (미국 MAP 테스트 기준)
INSERT INTO questions (question_text, question_type, subject, grade_level, system_type, options, correct_answer, explanation, difficulty_level, points) VALUES
-- Grade 6 Reading 문제들 (객관식 + 서술형)
('Read the passage: "The ancient civilization of Mesopotamia, often called the cradle of civilization, developed between the Tigris and Euphrates rivers around 3500 BCE. This region saw the rise of the first cities, the invention of writing, and the establishment of complex governmental systems." What does "cradle of civilization" most likely mean in this context?', 'multiple_choice', 'reading', 'Grade 6', 'us', '["The place where babies were born", "The birthplace or origin of civilization", "A place where people sleep", "The end of civilization"]', 'The birthplace or origin of civilization', 'A cradle is where babies begin life, so "cradle of civilization" means where civilization began.', 3, 2),

('Based on the Mesopotamia passage, write an analytical paragraph explaining why this region was so important to human development. Use at least three pieces of evidence from the text.', 'essay', 'reading', 'Grade 6', 'us', '[]', '', 'Students should analyze using evidence: first cities, invention of writing, complex governments, geographic advantages of river location.', 4, 5),

('Read this passage about climate change: "Scientists around the world agree that human activities are the primary cause of recent climate change. The burning of fossil fuels releases greenhouse gases into the atmosphere, trapping heat and causing global temperatures to rise." Explain in your own words how human activities cause climate change. Use evidence from the passage.', 'essay', 'reading', 'Grade 6', 'us', '[]', '', 'Students should explain the connection between burning fossil fuels, greenhouse gases, trapped heat, and rising temperatures using passage evidence.', 4, 6),

('Which of these is the best topic sentence for a paragraph about recycling?', 'multiple_choice', 'reading', 'Grade 6', 'us', '["Recycling is fun for everyone.", "Recycling helps protect our environment in several important ways.", "I like to recycle cans and bottles.", "Recycling centers are located in many cities."]', 'Recycling helps protect our environment in several important ways.', 'This topic sentence introduces the main idea and indicates that supporting details will follow.', 3, 2),

('Read this poem excerpt: "The wind whispered secrets through the trees, While shadows danced on autumn leaves." What literary device is the author using when describing the wind?', 'multiple_choice', 'reading', 'Grade 6', 'us', '["Metaphor", "Personification", "Alliteration", "Simile"]', 'Personification', 'The wind is given human qualities (whispering), which is personification.', 4, 3),

-- Grade 6 Math 문제들
('Sarah is planning a rectangular garden. The length is 3 times the width. If the perimeter is 48 feet, what are the dimensions of the garden?', 'short_answer', 'math', 'Grade 6', 'us', '[]', 'Width: 6 feet, Length: 18 feet', 'Set up equation: 2(w + 3w) = 48, solve for w = 6, then length = 18.', 4, 3),

('A recipe calls for 2¾ cups of flour to make 12 cookies. How many cups of flour are needed to make 30 cookies? Express your answer as a mixed number.', 'short_answer', 'math', 'Grade 6', 'us', '[]', '6⅞ cups', 'Set up proportion: 2¾/12 = x/30. Cross multiply and solve: x = 6⅞.', 4, 3),

('If the probability of rain tomorrow is 0.35, what is the probability that it will NOT rain tomorrow? Express as a decimal and as a percentage.', 'short_answer', 'math', 'Grade 6', 'us', '[]', '0.65 or 65%', 'Complementary probability: 1 - 0.35 = 0.65 = 65%.', 3, 2),

('The table shows books read by students: Jan(45), Feb(52), Mar(38), Apr(61), May(49). Calculate the mean and median.', 'short_answer', 'math', 'Grade 6', 'us', '[]', 'Mean: 49, Median: 49', 'Mean = (45+52+38+61+49)÷5 = 49. Ordered: 38,45,49,52,61, so median = 49.', 3, 3),

-- Grade 6 Writing 문제들  
('Write a narrative essay (4-5 paragraphs) about a time you overcame a challenge. Include dialogue and descriptive details.', 'essay', 'writing', 'Grade 6', 'us', '[]', '', 'Evaluate narrative techniques, character development, and descriptive writing.', 4, 7),

('Write a persuasive paragraph (5-7 sentences) arguing whether schools should require students to wear uniforms. Include at least two reasons supporting your position and use transition words to connect your ideas.', 'essay', 'writing', 'Grade 6', 'us', '[]', '', 'Students should provide clear thesis, supporting reasons, transitions, and proper paragraph structure.', 4, 5),

-- Grade 6 Speaking 문제들
('Present an argument for or against school uniforms. You have 3 minutes to persuade your audience with logical reasons.', 'speaking', 'speaking', 'Grade 6', 'us', '[]', '', 'Assess persuasive techniques, logical reasoning, and formal presentation skills.', 4, 5),

('You have 2 minutes to explain to a new student how to navigate your school building. Include directions to at least 3 important locations (cafeteria, library, main office). Speak clearly and use sequence words like "first," "next," and "finally."', 'speaking', 'speaking', 'Grade 6', 'us', '[]', '', 'Evaluate clarity, organization, use of sequence words, and helpful details.', 3, 4);

-- 다른 학년 샘플 문제들도 추가
INSERT INTO questions (question_text, question_type, subject, grade_level, system_type, options, correct_answer, explanation, difficulty_level, points) VALUES
-- Grade 1 문제들
('Look at this sentence: "The cat runs fast." Which word tells us HOW the cat runs?', 'multiple_choice', 'reading', 'Grade 1', 'us', '["cat", "runs", "fast", "the"]', 'fast', 'The word "fast" describes how the cat runs. It is an adverb.', 2, 1),

('Read this short story and write 2-3 sentences about what happens: "Sam found a lost puppy in the park. The puppy was hungry and scared. Sam gave the puppy some food and took it home to his family."', 'essay', 'reading', 'Grade 1', 'us', '[]', '', 'Student should identify main events: Sam found a puppy, puppy was hungry/scared, Sam helped and took it home.', 2, 2),

('Count and add: 🍎🍎🍎 + 🍎🍎 = ?', 'multiple_choice', 'math', 'Grade 1', 'us', '["3", "4", "5", "6"]', '5', '3 apples plus 2 apples equals 5 apples total.', 1, 1),

-- Grade 3 문제들  
('Write a short story (4-5 sentences) about a child who finds something magical. Include a beginning, middle, and end.', 'essay', 'reading', 'Grade 3', 'us', '[]', '', 'Evaluate story structure, creativity, sentence variety, and narrative flow.', 3, 4),

-- Grade 5 문제들
('Read this excerpt: "The young inventor tinkered with gears and springs, determined to create something that had never been built before. After months of failed attempts and countless revisions, she finally achieved her breakthrough." Analyze the character traits based on this passage. Write a paragraph with specific evidence.', 'essay', 'reading', 'Grade 5', 'us', '[]', '', 'Look for traits like persistent, creative, determined. Students should quote text evidence like "months of failed attempts" and "countless revisions."', 4, 5);
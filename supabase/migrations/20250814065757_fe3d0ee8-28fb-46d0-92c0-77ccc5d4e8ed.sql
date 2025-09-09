-- Add Grade 2 diagnostic test questions for US MAP standards
INSERT INTO questions (question_text, question_type, subject, grade_level, system_type, options, correct_answer, explanation, difficulty_level, points) VALUES
-- Grade 2 Reading questions
('Read this sentence: "The big, brown dog ran quickly to the park." Which word describes the dog?', 'multiple_choice', 'reading', 'Grade 2', 'us', '["ran", "big", "quickly", "park"]', 'big', 'The word "big" is an adjective that describes what the dog looks like.', 2, 1),

('Look at this story: "Maya lost her favorite book. She looked under her bed, in the kitchen, and in her backpack. Finally, she found it in the car." Where did Maya find her book?', 'multiple_choice', 'reading', 'Grade 2', 'us', '["Under her bed", "In the kitchen", "In her backpack", "In the car"]', 'In the car', 'The story says "Finally, she found it in the car."', 2, 1),

('Read this short passage and write 2-3 sentences about what happened: "Tim planted seeds in his garden. He watered them every day. After two weeks, tiny green plants started to grow."', 'essay', 'reading', 'Grade 2', 'us', '[]', '', 'Student should identify: Tim planted seeds, watered them daily, plants grew after two weeks.', 2, 3),

('What sound does the letter "ch" make in the word "chair"?', 'multiple_choice', 'reading', 'Grade 2', 'us', '["k sound", "ch sound", "s sound", "t sound"]', 'ch sound', 'The letters "ch" together make the "ch" sound as in "chair" and "cheese."', 2, 1),

-- Grade 2 Math questions  
('Count by 5s: 5, 10, 15, 20, ___. What number comes next?', 'multiple_choice', 'math', 'Grade 2', 'us', '["23", "24", "25", "30"]', '25', 'When counting by 5s, you add 5 each time: 20 + 5 = 25.', 2, 1),

('Sarah has 24 stickers. She gives 8 stickers to her friend. How many stickers does Sarah have left?', 'short_answer', 'math', 'Grade 2', 'us', '[]', '16', 'Subtract: 24 - 8 = 16 stickers left.', 2, 2),

('Look at this shape pattern: circle, square, triangle, circle, square, ___. What shape comes next?', 'multiple_choice', 'math', 'Grade 2', 'us', '["circle", "square", "triangle", "star"]', 'triangle', 'The pattern repeats every 3 shapes: circle, square, triangle, so triangle comes next.', 2, 2),

('Which number is greater: 47 or 39?', 'multiple_choice', 'math', 'Grade 2', 'us', '["47", "39", "They are equal", "Cannot tell"]', '47', '47 is greater than 39 because 4 tens is more than 3 tens.', 2, 1),

-- Grade 2 Writing questions
('Write 3 sentences about your favorite animal. Use correct spelling and punctuation.', 'essay', 'writing', 'Grade 2', 'us', '[]', '', 'Check for complete sentences, capital letters, periods, and reasonable spelling attempts.', 2, 4),

('Look at this picture prompt and write a short story (3-4 sentences) about what you see: A child building a snowman in the yard.', 'essay', 'writing', 'Grade 2', 'us', '[]', '', 'Evaluate narrative structure, descriptive details, and grade-appropriate writing skills.', 2, 4),

-- Grade 2 Speaking questions
('Tell me about what you did last weekend. Speak for 1 minute and use complete sentences.', 'speaking', 'speaking', 'Grade 2', 'us', '[]', '', 'Assess narrative skills, sentence structure, and clear pronunciation.', 2, 3),

('Describe your bedroom to someone who has never seen it. Include at least 3 details about what is in your room.', 'speaking', 'speaking', 'Grade 2', 'us', '[]', '', 'Evaluate descriptive language, organization of ideas, and clarity of speech.', 2, 3);
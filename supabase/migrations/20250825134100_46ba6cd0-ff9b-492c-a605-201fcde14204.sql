-- Insert Grade 6 Reading Passages
INSERT INTO reading_passages (title, content, system_type, grade_level, subject, difficulty_level, passage_type) VALUES 
(
  'Country Life v/s City Life',
  'City living and country living have a wide range of differences and similarities. Every day new people enter each and call it their home. When living in the city, you are an on-the-go kind of person and enjoy the world at a fast rhythm. In contrast, a country living style is slow and calm.

Today we make important decisions when deciding where to live. This is not a decision that is always easy to make. There are many things that you need to take into consideration. Like do you want your neighbors to be close, do you like to listen to the noise and traffic of the city? Don''t forget to consider your job, drive time and pets if you have or want them. For many people, this is one of the many important decisions they will ever have to make.

While living in the city, you have numerous things to do: the opportunities are endless. On any given night, you can walk around and enjoy the wonders of the city: the sights and the sounds take your breath away at all times. Nothing is more entertaining than walking on the pavement with other pedestrians, reading billboards or checking road signs, and watching cars pour from all corners and stop at traffic lights.

The city also has many different places to go to. Nice and expensive shops attract many tourists. There are a lot of restaurants too where you can get a casual or formal dinner; any way to enjoy yourself. If you are a city-dweller, you are always around much excitement. As far as I''m concerned, living in the city gives people a special feeling of superiority because of the nice shops, centers and modern architecture.

Although the city seems to have a lot of great things, the country can offer as much satisfaction as well. The country is a marvelous place to live in. It offers a very relaxing feeling, and it is filled with magnificent views and scenery. Rural towns offer more open space than cities and aren''t overcrowded.

The country can also maybe help you become a more independent and active person. You can buy a small piece of land, plough it and put some seeds in order to grow your own vegetables. This way you collect your own crops, and eat and live in a very healthy way. In addition, being in the countryside makes you more of an outdoor person often enjoying the voices and wild places of nature.

Not everyone is suited to the city life and not everyone has the desire to live permanently in the countryside. It is a matter of perspective and personal point of view.',
  'korea',
  '6학년', 
  'English Reading',
  3,
  'comprehension'
),
(
  'Teenagers and Phones: How to Be Smart About It',
  'Do you ever really think about this crazy new world in which every teenager (and most tweens) has a cellphone and instant access to mobile technology and social media of all kinds?

It''s a pretty amazing world and it''s changing by the minute. It''s hard to keep up with all the new technologies that spring up seemingly overnight. Think about it: smart phones with easy texting and Internet access have only been around for a little over five years now. The iPad just came out three years ago!

So the bottom line is that these technologies are SO new that researchers have barely had time to study their effects on kids'' brain and social development. But one thing we DO know for sure: the wrong kind of cellphone use can have some frightening consequences for our tweens and teens.

These days most parents give their children cellphones when they are between the ages of 8 and 13 - far too young, in my humble opinion. But I understand why: parents want to be able to connect with their kids easily - anytime, anywhere. And since all the OTHER kids have cellphones, it''s very hard to say "NO" to their own tweens and teens.

So, like lemmings, we all go over the cliff together, hoping that the landing will be soft. But here''s the problem: research shows that most tweens and young teens do not have the judgment and good sense to be careful about what they are texting and saying online in places like Facebook, Snap Chat, Twitter, and Instagram. And the number of social media sites where they can hang out and express themselves is growing daily.

Research proves that the part of the teenage brain responsible for reasoning, self-reflection, decision-making, and impulse control just isn''t well-developed yet; in fact, it''s not fully developed until their mid-to-late-20s!

Therefore, often tweens and teens just can''t think AHEAD about the long-term consequences of what they say and do online - even though what they say and do can be PERMANENTLY recorded and broadcast to millions of people instantly!

When parents give kids cell phones, they often think they''re protecting them by keeping in close contact. But the reality is, when tweens or young teens have cell phones, parents need to be even MORE protective than usual. And monitoring their texts and social media usage is a HUGE job - one that no generation of parents has ever been asked to do before!

As I said, it''s a crazy new world, but whether you like it or not, it''s probably here to stay.',
  'korea',
  '6학년',
  'English Reading', 
  3,
  'comprehension'
),
(
  'Inside my computer',
  'My computer-disassembled is a maze of cables, drives chips and ports--an array of connections, silver solderings, twisting wires.

But when the satiny case is latched in place coils and cables disappear. The smallest particle of matter is not an atom, but a byte-- a particle of magic that combines and multiplies unseen inside the blinking box.',
  'korea',
  '6학년',
  'English Reading',
  3, 
  'poetry'
);

-- Get the passage IDs for inserting questions
DO $$
DECLARE
    passage1_id UUID;
    passage2_id UUID; 
    passage3_id UUID;
BEGIN
    -- Get passage IDs
    SELECT id INTO passage1_id FROM reading_passages WHERE title = 'Country Life v/s City Life' AND grade_level = '6학년';
    SELECT id INTO passage2_id FROM reading_passages WHERE title = 'Teenagers and Phones: How to Be Smart About It' AND grade_level = '6학년';
    SELECT id INTO passage3_id FROM reading_passages WHERE title = 'Inside my computer' AND grade_level = '6학년';

    -- Insert questions for Passage 1: Country Life v/s City Life
    INSERT INTO reading_questions (passage_id, question_text, question_type, options, correct_answer, sample_answer, explanation, points, difficulty_level, question_order) VALUES
    (passage1_id, 'Find in the text a word that means the same as: Common points of comparison', 'short_answer', NULL, 'similarities', 'similarities', 'The text mentions "similarities" as common points of comparison between city and country life.', 2, 3, 1),
    (passage1_id, 'Find in the text a word that means the same as: Outgoing', 'short_answer', NULL, 'on-the-go', 'on-the-go', 'The text describes city people as "on-the-go kind of person".', 2, 3, 2),
    (passage1_id, 'Find in the text a word that means the same as: A lot, many', 'short_answer', NULL, 'numerous', 'numerous', 'The text uses "numerous" to mean many things to do in the city.', 2, 3, 3),
    (passage1_id, 'Find in the text a word that means the same as: Have fun doing', 'short_answer', NULL, 'enjoy', 'enjoy', 'The text frequently uses "enjoy" to describe having fun.', 2, 3, 4),
    (passage1_id, 'Find in the text a word that means the same as: Fun, enjoyable', 'short_answer', NULL, 'entertaining', 'entertaining', 'The text describes city walking as "entertaining".', 2, 3, 5),
    (passage1_id, 'Find in the text a word that means the same as: Wonderful', 'short_answer', NULL, 'marvelous', 'marvelous', 'The text describes the country as "marvelous".', 2, 3, 6),
    (passage1_id, 'Find in the text a word that means the same as: Filled, cramped', 'short_answer', NULL, 'overcrowded', 'overcrowded', 'The text mentions cities are "overcrowded" while rural towns are not.', 2, 3, 7),
    (passage1_id, 'Find in the text a word that means the same as: What we produce or harvest', 'short_answer', NULL, 'crops', 'crops', 'The text mentions collecting your own "crops" from vegetables you grow.', 2, 3, 8),
    (passage1_id, 'Explain "Country Life v/s City Life" in your own words', 'essay', NULL, NULL, 'It means comparing life in rural areas versus life in urban areas, looking at their differences and similarities.', 'Students should explain this as a comparison between rural and urban living.', 3, 3, 9),
    (passage1_id, 'Explain "Take your breath away" in your own words', 'essay', NULL, NULL, 'It means something so beautiful or amazing that it surprises you and makes you feel amazed.', 'Students should explain this idiom means to be amazed or astonished.', 3, 3, 10),
    (passage1_id, 'Explain "As far as I am concerned" in your own words', 'essay', NULL, NULL, 'It means "in my opinion" or "from my point of view".', 'Students should recognize this phrase expresses personal opinion.', 3, 3, 11),
    (passage1_id, 'What is the difference between a "house" and a "home"?', 'essay', NULL, NULL, 'A house is just a building, but a home is where you feel comfortable and belong with your family.', 'Students should distinguish between the physical structure and emotional connection.', 4, 3, 12),
    (passage1_id, 'What can people who live in the city do? Mention at least 2 different activities or attractions. Use your own words.', 'essay', NULL, NULL, 'People can visit shops and restaurants, walk around enjoying the sights and sounds, go to tourist attractions.', 'Students should identify city activities mentioned in the passage.', 4, 3, 13),
    (passage1_id, 'In your own words, explain how living in the country is better than living in the city. Include at least two reasons in your answer.', 'essay', NULL, NULL, 'Country life is more relaxing with beautiful scenery, offers more open space, and lets you grow your own food and be more independent.', 'Students should identify benefits of country life from the passage.', 5, 3, 14),
    (passage1_id, 'What kind of person likes living in the city? What kind of person enjoys the countryside more?', 'essay', NULL, NULL, 'City people are on-the-go and like fast-paced life with excitement. Country people prefer slow, calm, relaxing lifestyle with nature.', 'Students should contrast personality types suited to each environment.', 4, 3, 15),
    (passage1_id, 'Does the writer prefer to live in rural towns? Justify by quoting the text.', 'essay', NULL, NULL, 'No clear preference is shown. The text says "Not everyone is suited to the city life and not everyone has the desire to live permanently in the countryside. It is a matter of perspective and personal point of view."', 'Students should recognize the neutral stance with the given quote.', 4, 3, 16),
    (passage1_id, 'What about you? Where do you prefer to live? Explain why. (60 words)', 'essay', NULL, NULL, 'Personal answer - students should give their preference with reasons.', 'Students should express personal preference with reasoning in about 60 words.', 5, 3, 17);

    -- Insert questions for Passage 2: Teenagers and Phones
    INSERT INTO reading_questions (passage_id, question_text, question_type, options, correct_answer, sample_answer, explanation, points, difficulty_level, question_order) VALUES
    (passage2_id, 'In this article the author has a major concern. Which of the following best describes what the author is concerned about?', 'multiple_choice', '["The inability of parents to protect their children", "The advantages presented by social media sites", "The need for tweens and teens to use cellphones responsibly", "The lack of research being done on cellphone usage"]', 'The need for tweens and teens to use cellphones responsibly', NULL, 'The main concern is about responsible cellphone use by young people.', 3, 3, 1),
    (passage2_id, 'Which of the following best describes the tone of the writer?', 'multiple_choice', '["Unbiased", "Unfair", "Uncaring", "Unsure"]', 'Unsure', NULL, 'The writer expresses uncertainty about this new technological world.', 3, 3, 2),
    (passage2_id, 'Give a reason for the use of the apostrophe in "it''s".', 'short_answer', NULL, 'contraction', 'It is a contraction meaning "it is"', 'The apostrophe shows letters have been omitted in the contraction.', 2, 3, 3),
    (passage2_id, 'Why are inverted commas used in "NO"?', 'short_answer', NULL, 'emphasis', 'To show emphasis or stress on the word', 'Quotation marks are used for emphasis on the word NO.', 2, 3, 4),
    (passage2_id, 'Which of the following best describes the expression "spring up"?', 'multiple_choice', '["Extremely fast development of new technology", "The world growing at an amazingly fast rate", "High number of teenagers with cellphones", "Increasing sales of cellphones to teenagers"]', 'Extremely fast development of new technology', NULL, 'Spring up means to appear or develop quickly, referring to new technologies.', 3, 3, 5),
    (passage2_id, 'Do you think that children between the ages of 8 and 13 are too young to have cellphones? Based on the text, give one reason for your answer.', 'essay', NULL, NULL, 'Yes, because their brains are not fully developed for good judgment and decision-making until their mid-to-late 20s.', 'Students should reference the brain development information from the text.', 4, 3, 6),
    (passage2_id, 'What is the main idea of paragraph 6?', 'multiple_choice', '["Using a cellphone today is like jumping off a cliff", "Not enough research has been done on cellphone usage", "Teens are unable to be careful when they use social media", "All teens and tweens are careful when using social media"]', 'Teens are unable to be careful when they use social media', NULL, 'The paragraph explains that teens lack judgment for careful social media use.', 3, 3, 7),
    (passage2_id, 'Choose the most suitable synonym for "hang out" as used in line 21:', 'multiple_choice', '["Resort", "Spread", "Meet", "Separate"]', 'Meet', NULL, 'Hang out means to spend time or meet with others.', 2, 3, 8),
    (passage2_id, 'What do the words "impulse control" mean as used in line 24?', 'multiple_choice', '["The rules parents have for teens using cellphones", "The control parents have over teens'' cellphone use", "The tendency to do something without thinking carefully", "The ability to think carefully before doing something"]', 'The ability to think carefully before doing something', NULL, 'Impulse control is the ability to resist sudden urges and think before acting.', 3, 3, 9),
    (passage2_id, 'What is the superlative form of "more"?', 'multiple_choice', '["Many", "Most", "Much", "Much more"]', 'Most', NULL, 'The superlative form of "more" is "most".', 2, 3, 10),
    (passage2_id, 'The writer states that parents should monitor the text and social media usage of their teenage children. Do you agree with this view? Give one reason based on the text for your response.', 'essay', NULL, NULL, 'Yes/No with reasoning based on text about brain development and consequences.', 'Students should give their opinion with text-based reasoning.', 4, 3, 11),
    (passage2_id, 'Select the meaning of "tweens" as used in paragraph 3, line 11.', 'multiple_choice', '["Teenagers about to be adults", "Children about to be teenagers", "Immature, childish teenagers", "Reckless, irresponsible teenagers"]', 'Children about to be teenagers', NULL, 'Tweens refers to children between childhood and teens (ages 9-12).', 2, 3, 12),
    (passage2_id, 'Join the following simple sentences into one complex sentence by using the conjunction "although": Parents monitor their children''s text and social media usage. Parents need to be even more protective than usual.', 'short_answer', NULL, 'Although parents monitor their children''s text and social media usage, parents need to be even more protective than usual.', 'Although parents monitor their children''s text and social media usage, parents need to be even more protective than usual.', 'Students should correctly use "although" to join the sentences.', 3, 3, 13),
    (passage2_id, 'Give a synonym for "crazy" as used in paragraph 10, line 34.', 'short_answer', NULL, 'wild/strange/unusual', 'wild, strange, unusual, or chaotic', 'Students should provide an appropriate synonym for crazy in this context.', 2, 3, 14),
    (passage2_id, 'Will parents protect their children enough by giving them cellphones to keep in close contact? Give one reason for your answer from the text.', 'essay', NULL, NULL, 'No, because parents need to be even MORE protective when kids have cellphones, and monitoring is a huge job.', 'Students should reference the text about increased protection needs.', 4, 3, 15),
    (passage2_id, 'In paragraph 2 the writer is amazed by how fast technology is developing. Quote a phrase from paragraph 2 that shows this amazement.', 'short_answer', NULL, 'spring up seemingly overnight', '"spring up seemingly overnight" or "changing by the minute"', 'Students should identify phrases showing rapid technological change.', 3, 3, 16),
    (passage2_id, 'How does the writer create sympathy for parents in lines 31-33 of paragraph 9?', 'essay', NULL, NULL, 'By calling monitoring a "HUGE job" and saying no generation of parents has been asked to do this before.', 'Students should identify how the writer emphasizes the difficulty and novelty of the parental task.', 4, 3, 17);

    -- Insert questions for Passage 3: Inside my computer
    INSERT INTO reading_questions (passage_id, question_text, question_type, options, correct_answer, sample_answer, explanation, points, difficulty_level, question_order) VALUES
    (passage3_id, 'Which word best describes the style of writing in the first stanza?', 'multiple_choice', '["Narration", "Description", "Argument", "Reflection"]', 'Description', NULL, 'The first stanza describes the physical components of a disassembled computer.', 3, 3, 1),
    (passage3_id, 'Which word best describes the poet''s tone in the second stanza?', 'multiple_choice', '["Amazement", "Affection", "Apathy", "Sympathy"]', 'Amazement', NULL, 'The poet expresses wonder at the "magic" and invisible processes of the computer.', 3, 3, 2),
    (passage3_id, 'Identify the figure of speech in line 2 of stanza 1.', 'short_answer', NULL, 'metaphor', 'metaphor', 'The computer is compared to a maze, which is a metaphor.', 3, 3, 3),
    (passage3_id, 'What are the two things being compared in this figure of speech (line 2)?', 'short_answer', NULL, 'computer and maze', 'The disassembled computer and a maze', 'The complex internal structure of the computer is compared to a maze.', 3, 3, 4),
    (passage3_id, 'Why is the above comparison suitable? Suggest two reasons.', 'essay', NULL, NULL, 'Both are complex with many pathways/connections, and both can be confusing to navigate.', 'Students should explain why comparing a computer to a maze is appropriate.', 4, 3, 5),
    (passage3_id, 'Identify the figure of speech in line 13 of stanza 2.', 'short_answer', NULL, 'metaphor', 'metaphor', 'Calling a byte "a particle of magic" is a metaphor.', 3, 3, 6),
    (passage3_id, 'Explain the figure of speech in line 13.', 'essay', NULL, NULL, 'The byte is compared to magic because it does amazing things that seem impossible to understand.', 'Students should explain how bytes are compared to magic particles.', 4, 3, 7),
    (passage3_id, 'Do you think that the poet is exaggerating the power contained within computers? Give two reasons for your answer.', 'essay', NULL, NULL, 'Personal opinion with reasons - could argue yes (calling it magic) or no (computers do amazing things).', 'Students should give their opinion with two supporting reasons.', 5, 3, 8);

END $$;
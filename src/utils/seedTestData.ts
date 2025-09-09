import { supabase } from "@/integrations/supabase/client";

export const seedTestData = async () => {
  try {
    // 한국 시스템 수학 진단 문제들
    const koreanMathQuestions = [
      {
        system_type: "korea",
        grade_level: "초2", 
        subject: "Math",
        question_text: "5 + 3은 얼마인가요?",
        question_type: "multiple_choice",
        options: ["6", "7", "8", "9"],
        correct_answer: "8",
        explanation: "5와 3을 더하면 8입니다.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "Math", 
        question_text: "삼각형의 변은 몇 개인가요?",
        question_type: "short_answer",
        options: null,
        correct_answer: "3",
        explanation: "삼각형은 항상 3개의 변을 가지고 있습니다.",
        points: 1,
        difficulty_level: 1
      },
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "Math",
        question_text: "민수는 스티커를 12장 가지고 있었습니다. 친구에게 4장을 주고 6장을 더 샀습니다. 민수가 가진 스티커는 모두 몇 장인가요?",
        question_type: "multiple_choice",
        options: ["10장", "12장", "14장", "16장"],
        correct_answer: "14장",
        explanation: "12 - 4 + 6 = 14장입니다.",
        points: 3,
        difficulty_level: 3
      }
    ];

    // 한국 시스템 영어 독해 진단 문제들
    const koreanEnglishReadingQuestions = [
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "English Reading",
        question_text: "다음 중 'cat'과 운율이 맞는 단어는?",
        question_type: "multiple_choice", 
        options: ["dog", "hat", "car", "big"],
        correct_answer: "hat",
        explanation: "hat과 cat은 둘 다 'at' 소리로 끝나므로 운율이 맞습니다.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "korea", 
        grade_level: "초2",
        subject: "English Reading",
        question_text: "다음 문장을 읽고 답하세요. 'The little bird flew to the tall tree.' 새가 한 일은?",
        question_type: "multiple_choice",
        options: ["walked", "flew", "ran", "jumped"],
        correct_answer: "flew",
        explanation: "문장에서 새가 'flew'(날았다)라고 명확히 나와 있습니다.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "English Reading",
        question_text: "다음을 읽어보세요: 'The sun is bright. The flowers are colorful.' 태양을 설명하는 단어는?",
        question_type: "multiple_choice",
        options: ["colorful", "bright", "small", "cold"],
        correct_answer: "bright",
        explanation: "문장에서 'The sun is bright'라고 했습니다.",
        points: 2,
        difficulty_level: 1
      }
    ];

    // 한국 시스템 영어 작문 진단 문제들
    const koreanEnglishWritingQuestions = [
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "English Writing",
        question_text: "좋아하는 동물에 대해 2-3문장으로 영어로 써보세요.",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "영어 문장 구성 연습을 위한 창작 문제입니다.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "English Writing",
        question_text: "다음 문장을 완성하세요: 'I like to eat _____ for breakfast.'",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "올바른 문법으로 완전한 문장을 작성해야 합니다.",
        points: 2,
        difficulty_level: 1
      }
    ];

    // 한국 시스템 스피킹 진단 문제들
    const koreanSpeakingQuestions = [
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "Speaking",
        question_text: "어제 한 일에 대해 영어로 30초 정도 말해보세요.",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "과거 사건을 영어로 설명하는 연습입니다.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "Speaking",
        question_text: "좋아하는 음식에 대해 영어로 설명하고 이유를 말해보세요.",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "선호도 표현과 이유 설명 연습입니다.",
        points: 3,
        difficulty_level: 2
      }
    ];

    // 미국 시스템 수학 진단 문제들
    const mathQuestions = [
      {
        system_type: "us",
        grade_level: "Grade 2", 
        subject: "Math",
        question_text: "What is 5 + 3?",
        question_type: "multiple_choice",
        options: ["6", "7", "8", "9"],
        correct_answer: "8",
        explanation: "When you add 5 and 3 together, you get 8.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "Math", 
        question_text: "How many sides does a triangle have?",
        question_type: "short_answer",
        options: null,
        correct_answer: "3",
        explanation: "A triangle always has exactly 3 sides.",
        points: 1,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "Math",
        question_text: "Sarah has 12 stickers. She gives 4 stickers to her friend and buys 6 more. How many stickers does she have now?",
        question_type: "multiple_choice",
        options: ["10", "12", "14", "16"],
        correct_answer: "14",
        explanation: "Sarah starts with 12, gives away 4 (12-4=8), then buys 6 more (8+6=14).",
        points: 3,
        difficulty_level: 3
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "Math",
        question_text: "What is 15 - 7?",
        question_type: "multiple_choice",
        options: ["6", "7", "8", "9"],
        correct_answer: "8",
        explanation: "15 minus 7 equals 8.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "Math",
        question_text: "Count by 2s: 2, 4, 6, __, 10",
        question_type: "short_answer",
        options: null,
        correct_answer: "8",
        explanation: "Counting by 2s: 2, 4, 6, 8, 10.",
        points: 2,
        difficulty_level: 2
      }
    ];

    // 영어 독해 진단 문제들
    const englishReadingQuestions = [
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Which word rhymes with 'cat'?",
        question_type: "multiple_choice", 
        options: ["dog", "hat", "car", "big"],
        correct_answer: "hat",
        explanation: "Hat rhymes with cat because they both end with the 'at' sound.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us", 
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Read: 'The little bird flew to the tall tree.' What did the bird do?",
        question_type: "multiple_choice",
        options: ["walked", "flew", "ran", "jumped"],
        correct_answer: "flew",
        explanation: "The text clearly states that the bird 'flew' to the tree.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Read: 'The sun is bright. The flowers are colorful.' What describes the sun?",
        question_type: "multiple_choice",
        options: ["colorful", "bright", "small", "cold"],
        correct_answer: "bright",
        explanation: "The text says 'The sun is bright.'",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "What is the opposite of 'big'?",
        question_type: "short_answer",
        options: null,
        correct_answer: "small",
        explanation: "Small is the opposite of big.",
        points: 1,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Read: 'Tom likes to play soccer. He practices every day after school.' When does Tom practice?",
        question_type: "multiple_choice",
        options: ["in the morning", "after school", "at night", "before school"],
        correct_answer: "after school",
        explanation: "The text states Tom practices 'every day after school.'",
        points: 2,
        difficulty_level: 2
      }
    ];

    // 영어 작문 진단 문제들
    const englishWritingQuestions = [
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Write 2-3 sentences about your favorite animal.",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "This is a creative writing exercise to practice sentence formation.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Complete the sentence: 'I like to eat _____ for breakfast.'",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "Students should write a complete sentence with proper grammar.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Write about what you did yesterday. Use at least 3 sentences.",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "Practice writing about past events using proper sentence structure.",
        points: 4,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Describe your bedroom in 2-3 sentences.",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "Practice descriptive writing with adjectives.",
        points: 3,
        difficulty_level: 2
      }
    ];

    // 스피킹 진단 문제들
    const speakingQuestions = [
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Tell me about what you did yesterday. Speak for about 30 seconds.",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "This speaking exercise helps practice describing past events.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Describe your favorite food. Why do you like it?",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "Practice expressing preferences and giving reasons.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Count from 1 to 10 out loud.",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "Practice number pronunciation and fluency.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Tell me about your family. Who lives in your house?",
        question_type: "speaking",
        options: null,
        correct_answer: null,
        explanation: "Practice describing family members and relationships.",
        points: 3,
        difficulty_level: 2
      }
    ];

    // 기타 과목 문제들 (SSAT 등을 위한)
    const otherSubjectQuestions = [
      {
        system_type: "us", 
        grade_level: "Grade 2",
        subject: "Science",
        question_text: "What do plants need to grow?",
        question_type: "multiple_choice",
        options: ["Only water", "Only sunlight", "Water and sunlight", "Nothing"],
        correct_answer: "Water and sunlight",
        explanation: "Plants need both water and sunlight to grow healthy and strong.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2", 
        subject: "Social Studies",
        question_text: "What is the capital city of the United States?",
        question_type: "short_answer",
        options: null,
        correct_answer: "Washington D.C.",
        explanation: "Washington D.C. is the capital city where the government is located.",
        points: 2,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2", 
        subject: "Science",
        question_text: "Explain why we need to wash our hands. Write 2-3 sentences.",
        question_type: "essay",
        options: null,
        correct_answer: null,
        explanation: "Students should mention removing germs and staying healthy.",
        points: 3,
        difficulty_level: 2
      }
    ];

    // 모든 문제를 하나의 배열로 합치기
    const sampleQuestions = [
      ...koreanMathQuestions,
      ...koreanEnglishReadingQuestions,
      ...koreanEnglishWritingQuestions,
      ...koreanSpeakingQuestions,
      ...mathQuestions,
      ...englishReadingQuestions, 
      ...englishWritingQuestions,
      ...speakingQuestions,
      ...otherSubjectQuestions
    ];

    console.log("시작: 테스트 데이터 삽입 중...");
    
    // RLS 정책을 우회하기 위해 service role로 삽입 시도
    const { data, error } = await supabase
      .from('questions')
      .insert(sampleQuestions)
      .select();

    if (error) {
      console.error("데이터 삽입 오류:", error);
      throw error;
    }

    console.log("성공: 테스트 데이터가 삽입되었습니다:", data);
    return data;
    
  } catch (error) {
    console.error("테스트 데이터 시드 실패:", error);
    throw error;
  }
};
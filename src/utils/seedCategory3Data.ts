
import { supabase } from "@/integrations/supabase/client";

export const seedCategory3Data = async () => {
  try {
    // 카테고리 3: 영어 작문 문제들
    const category3Questions = [
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "English Writing",
        question_text: "좋아하는 동물에 대해 2-3문장으로 영어로 써보세요.",
        question_type: "subjective",
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
        question_type: "subjective",
        options: null,
        correct_answer: null,
        explanation: "올바른 문법으로 완전한 문장을 작성해야 합니다.",
        points: 2,
        difficulty_level: 1
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Write 2-3 sentences about your favorite animal.",
        question_type: "subjective",
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
        question_type: "subjective",
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
        question_text: "Describe your bedroom in 2-3 sentences.",
        question_type: "subjective",
        options: null,
        correct_answer: null,
        explanation: "Practice descriptive writing with adjectives.",
        points: 3,
        difficulty_level: 2
      }
    ];

    console.log("카테고리 3 테스트 데이터 삽입 중...");
    
    const { data, error } = await supabase
      .from('questions')
      .insert(category3Questions)
      .select();

    if (error) {
      console.error("카테고리 3 데이터 삽입 오류:", error);
      throw error;
    }

    console.log("카테고리 3 테스트 데이터 삽입 완료:", data);
    return data;
    
  } catch (error) {
    console.error("카테고리 3 테스트 데이터 시드 실패:", error);
    throw error;
  }
};

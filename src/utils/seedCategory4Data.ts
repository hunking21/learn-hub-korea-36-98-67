
import { supabase } from "@/integrations/supabase/client";

export const seedCategory4Data = async () => {
  try {
    // 카테고리 4: 스피킹 및 기타 과목 문제들
    const category4Questions = [
      {
        system_type: "korea",
        grade_level: "초2",
        subject: "Speaking",
        question_text: "어제 한 일에 대해 영어로 30초 정도 말해보세요.",
        question_type: "subjective",
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
        question_type: "subjective",
        options: null,
        correct_answer: null,
        explanation: "선호도 표현과 이유 설명 연습입니다.",
        points: 3,
        difficulty_level: 2
      },
      {
        system_type: "us",
        grade_level: "Grade 2",
        subject: "English",
        question_text: "Tell me about what you did yesterday. Speak for about 30 seconds.",
        question_type: "subjective",
        options: null,
        correct_answer: null,
        explanation: "This speaking exercise helps practice describing past events.",
        points: 3,
        difficulty_level: 2
      },
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
        question_type: "subjective",
        options: null,
        correct_answer: "Washington D.C.",
        explanation: "Washington D.C. is the capital city where the government is located.",
        points: 2,
        difficulty_level: 2
      }
    ];

    console.log("카테고리 4 테스트 데이터 삽입 중...");
    
    const { data, error } = await supabase
      .from('questions')
      .insert(category4Questions)
      .select();

    if (error) {
      console.error("카테고리 4 데이터 삽입 오류:", error);
      throw error;
    }

    console.log("카테고리 4 테스트 데이터 삽입 완료:", data);
    return data;
    
  } catch (error) {
    console.error("카테고리 4 테스트 데이터 시드 실패:", error);
    throw error;
  }
};

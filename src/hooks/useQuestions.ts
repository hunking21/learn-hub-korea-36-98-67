// Temporarily disabled - tables don't exist yet
// This hook will be restored when question tables are recreated

export interface Question {
  id: string;
  subject: string;
  system_type: string;
  grade_level: string;
  question_type: 'multiple_choice' | 'subjective';
  question_text: string;
  explanation: string;
  options?: string[] | null;
  correct_answer?: string | null;
  points: number;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
  category?: string;
}

export const useQuestions = (params: {
  system?: string;
  grade?: string;
  subject?: string;
  category?: string;
}) => {
  return {
    data: [] as Question[],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
};

export const useQuestionsByCategory = (category: string, params?: {
  system?: string;
  grade?: string;
  subject?: string;
}) => {
  return {
    data: [] as Question[],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
};
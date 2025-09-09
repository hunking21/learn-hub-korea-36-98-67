import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReadingTestSession {
  id: string;
  user_id: string;
  passage_id: string;
  status: string;
  total_questions: number;
  answered_questions: number;
  score?: number | null;
  started_at: string;
  completed_at?: string | null;
}

export interface ReadingTestAnswer {
  id: string;
  session_id: string;
  question_id: string;
  user_answer?: string | null;
  is_correct?: boolean | null;
  points_earned: number;
  answered_at: string;
}

export const useCreateReadingTestSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { passage_id: string; total_questions: number; max_possible_score: number }) => {
      // Get current user from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: session, error } = await supabase
        .from('reading_test_sessions')
        .insert({
          user_id: user.id,
          passage_id: data.passage_id,
          total_questions: data.total_questions,
          answered_questions: 0,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-test-sessions'] });
    },
  });
};

export const useReadingTestSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['reading-test-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('reading_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useUpdateReadingTestSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; status?: string; completed_at?: string; answered_questions?: number; score?: number }) => {
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.completed_at) updateData.completed_at = data.completed_at;
      if (data.answered_questions !== undefined) updateData.answered_questions = data.answered_questions;
      if (data.score !== undefined) updateData.score = data.score;

      const { data: session, error } = await supabase
        .from('reading_test_sessions')
        .update(updateData)
        .eq('id', data.sessionId)
        .select()
        .single();

      if (error) throw error;
      return session;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reading-test-session', variables.sessionId] });
    },
  });
};

export const useSubmitReadingAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { session_id: string; question_id: string; user_answer: string; is_correct: boolean; score: number }) => {
      const { data: answer, error } = await supabase
        .from('reading_answers')
        .insert({
          session_id: data.session_id,
          question_id: data.question_id,
          user_answer: data.user_answer,
          is_correct: data.is_correct,
          points_earned: data.score
        })
        .select()
        .single();

      if (error) throw error;
      return answer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-answers'] });
    },
  });
};

export const useReadingTestAnswers = (sessionId: string) => {
  return useQuery({
    queryKey: ['reading-answers', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('reading_answers')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};
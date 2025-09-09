import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReadingQuestion {
  id: string;
  passage_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[] | null;
  correct_answer: string;
  points: number;
  created_at: string;
}

export const useReadingQuestions = (passageId: string) => {
  return useQuery({
    queryKey: ['reading-questions', passageId],
    queryFn: async () => {
      if (!passageId) return [];
      
      const { data, error } = await supabase
        .from('reading_questions')
        .select('*')
        .eq('passage_id', passageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!passageId,
  });
};

export const useCreateReadingQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<ReadingQuestion, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('reading_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reading-questions', variables.passage_id] });
    },
  });
};

export const useUpdateReadingQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...question }: Partial<ReadingQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_questions')
        .update(question)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reading-questions', data.passage_id] });
    },
  });
};

export const useDeleteReadingQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, passage_id }: { id: string; passage_id: string }) => {
      const { error } = await supabase
        .from('reading_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reading-questions', variables.passage_id] });
    },
  });
};
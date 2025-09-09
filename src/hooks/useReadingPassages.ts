import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  grade_level: string;
  difficulty_level: number;
  created_at: string;
  question_count?: number;
  total_points?: number;
}

export const useReadingPassages = (params?: {
  grade?: string;
}) => {
  return useQuery({
    queryKey: ['reading-passages', params],
    queryFn: async () => {
      let query = supabase.from('reading_passages').select(`
        *,
        reading_questions(count)
      `);

      if (params?.grade) {
        query = query.eq('grade_level', params.grade);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(passage => ({
        ...passage,
        question_count: passage.reading_questions?.[0]?.count || 0
      })) || [];
    },
  });
};

export const useReadingPassage = (passageId: string) => {
  return useQuery({
    queryKey: ['reading-passage', passageId],
    queryFn: async () => {
      if (!passageId) return null;
      
      const { data, error } = await supabase
        .from('reading_passages')
        .select('*')
        .eq('id', passageId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!passageId,
  });
};

export const useCreateReadingPassage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passage: Omit<ReadingPassage, 'id' | 'created_at' | 'question_count' | 'total_points'>) => {
      const { data, error } = await supabase
        .from('reading_passages')
        .insert([passage])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-passages'] });
    },
  });
};

export const useUpdateReadingPassage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...passage }: Partial<ReadingPassage> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_passages')
        .update(passage)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-passages'] });
    },
  });
};

export const useDeleteReadingPassage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reading_passages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-passages'] });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TestSessionWithDetails {
  id: string;
  user_id: string;
  passage_id: string;
  status: string;
  total_questions: number;
  answered_questions: number;
  score?: number | null;
  started_at: string;
  completed_at?: string | null;
  user?: {
    username: string;
    full_name: string;
  };
  passage?: {
    title: string;
    grade_level: string;
  };
}

export const useTestSessions = (params?: {
  status?: string;
  user_id?: string;
  passage_id?: string;
}) => {
  return useQuery({
    queryKey: ['test-sessions', params],
    queryFn: async () => {
      let query = supabase
        .from('reading_test_sessions')
        .select(`
          *,
          users!reading_test_sessions_user_id_fkey(username, full_name),
          reading_passages!reading_test_sessions_passage_id_fkey(title, grade_level)
        `);

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.user_id) {
        query = query.eq('user_id', params.user_id);
      }
      if (params?.passage_id) {
        query = query.eq('passage_id', params.passage_id);
      }

      const { data, error } = await query.order('started_at', { ascending: false });

      if (error) throw error;
      return data?.map(session => ({
        ...session,
        user: session.users,
        passage: session.reading_passages
      })) || [];
    },
  });
};

export const useTestSessionsByPassage = (passageId: string) => {
  return useQuery({
    queryKey: ['test-sessions-by-passage', passageId],
    queryFn: async () => {
      if (!passageId) return [];
      
      const { data, error } = await supabase
        .from('reading_test_sessions')
        .select(`
          *,
          users!reading_test_sessions_user_id_fkey(username, full_name)
        `)
        .eq('passage_id', passageId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data?.map(session => ({
        ...session,
        user: session.users
      })) || [];
    },
    enabled: !!passageId,
  });
};

export const useSessionAnalytics = () => {
  return useQuery({
    queryKey: ['session-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_test_sessions')
        .select(`
          status,
          score,
          completed_at,
          started_at,
          passage_id,
          reading_passages!reading_test_sessions_passage_id_fkey(grade_level)
        `);

      if (error) throw error;

      const analytics = {
        totalSessions: data?.length || 0,
        completedSessions: data?.filter(s => s.status === 'completed').length || 0,
        averageScore: 0,
        gradeDistribution: {} as Record<string, number>,
        completionRate: 0
      };

      if (data && data.length > 0) {
        const completedWithScores = data.filter(s => s.status === 'completed' && s.score !== null);
        if (completedWithScores.length > 0) {
          analytics.averageScore = completedWithScores.reduce((acc, s) => acc + (s.score || 0), 0) / completedWithScores.length;
        }

        analytics.completionRate = (analytics.completedSessions / analytics.totalSessions) * 100;

        // Grade distribution
        data.forEach(session => {
          const grade = session.reading_passages?.grade_level || '기타';
          analytics.gradeDistribution[grade] = (analytics.gradeDistribution[grade] || 0) + 1;
        });
      }

      return analytics;
    },
  });
};
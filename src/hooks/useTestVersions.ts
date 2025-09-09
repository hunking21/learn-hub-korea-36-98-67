import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TestVersion {
  id: string;
  master_id: string;
  grade_level: string;
  system_type: string;
  visibility?: string;
  access_mode?: string;
  is_active: boolean;
  opens_at?: string;
  closes_at?: string;
  time_limit_minutes?: number;
  max_attempts?: number;
  created_at: string;
  updated_at: string;
  test_masters?: {
    id: string;
    name: string;
    description?: string;
  };
}

export const useTestVersions = () => {
  const [testVersions, setTestVersions] = useState<TestVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, sessionToken } = useAuth();

  useEffect(() => {
    const fetchTestVersions = async () => {
      if (!profile || !sessionToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Set session token for RLS
        await supabase.rpc('set_request_header', {
          key: 'request.jwt.claims',
          value: JSON.stringify({ session_token: sessionToken })
        });

        // 간단하게 활성 시험만 조회
        const { data, error: fetchError } = await supabase
          .from('test_versions')
          .select(`
            id,
            master_id,
            grade_level,
            system_type,
            visibility,
            access_mode,
            is_active,
            opens_at,
            closes_at,
            time_limit_minutes,
            max_attempts,
            created_at,
            updated_at,
            test_masters (
              id,
              name,
              description
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        // 타입 변환하여 설정
        const typedData: TestVersion[] = (data || []).map((item: any) => ({
          id: item.id,
          master_id: item.master_id,
          grade_level: item.grade_level,
          system_type: item.system_type,
          visibility: item.visibility,
          access_mode: item.access_mode,
          is_active: item.is_active,
          opens_at: item.opens_at,
          closes_at: item.closes_at,
          time_limit_minutes: item.time_limit_minutes,
          max_attempts: item.max_attempts,
          created_at: item.created_at,
          updated_at: item.updated_at,
          test_masters: item.test_masters
        }));

        setTestVersions(typedData);
      } catch (err: any) {
        console.error('Error fetching test versions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestVersions();
  }, [profile, sessionToken]);

  return { testVersions, loading, error, refetch: () => setLoading(true) };
};
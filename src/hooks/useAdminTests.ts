import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TestMaster {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

interface TestVersion {
  id: string;
  master_id: string;
  grade_level: string;
  system_type: string;
  time_limit_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TestSection {
  id: string;
  version_id: string;
  name: string;
  description: string | null;
  order_index: number;
  time_limit_minutes: number | null;
  score_weight: number;
  created_at: string;
  updated_at: string;
  question_count?: number;
}

interface AdminTest extends TestMaster {
  test_versions: (TestVersion & {
    test_sections: TestSection[];
  })[];
}

interface UseAdminTestsProps {
  system?: string;
  grade?: string;
}

export function useAdminTests({ system, grade }: UseAdminTestsProps = {}) {
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('test_masters')
        .select(`
          *,
          test_versions(
            *,
            test_sections(
              *,
              test_section_questions(count)
            )
          )
        `)
        .eq('test_versions.is_active', true);

      // Filter by system and grade if provided
      if (system) {
        query = query.eq('test_versions.system_type', system);
      }
      if (grade) {
        query = query.eq('test_versions.grade_level', grade);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error loading admin tests:', fetchError);
        throw fetchError;
      }

      // Process the data to count questions
      const processedTests = (data || []).map(test => ({
        ...test,
        test_versions: test.test_versions.map(version => ({
          ...version,
          test_sections: version.test_sections.map(section => ({
            ...section,
            question_count: section.test_section_questions?.[0]?.count || 0
          }))
        }))
      }));

      setTests(processedTests);
    } catch (err) {
      console.error('Error in useAdminTests:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();

    // Set up realtime subscriptions
    const channel = supabase
      .channel('admin-tests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_masters'
        },
        () => {
          console.log('Test masters changed, reloading...');
          loadTests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_versions'
        },
        () => {
          console.log('Test versions changed, reloading...');
          loadTests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_sections'
        },
        () => {
          console.log('Test sections changed, reloading...');
          loadTests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_section_questions'
        },
        () => {
          console.log('Test section questions changed, reloading...');
          loadTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [system, grade]);

  return {
    tests,
    isLoading,
    error,
    refetch: loadTests
  };
}
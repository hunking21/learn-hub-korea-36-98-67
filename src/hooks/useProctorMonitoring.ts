import { useState, useEffect } from 'react';
import { memoryRepo } from '@/repositories/memoryRepo';
import type { TestAttempt, Test, TestVersion } from '@/types';

export interface MonitoringAttempt extends TestAttempt {
  test?: Test;
  version?: TestVersion;
  elapsedTime: number;
  remainingTime: number;
  violationCount: number;
  lastActivity: string;
  isLockdownMode: boolean;
  lockdownViolations: number;
}

export const useProctorMonitoring = () => {
  const [attempts, setAttempts] = useState<MonitoringAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<MonitoringAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInProgressAttempts = async () => {
    try {
      const allAttempts = await memoryRepo.getAllAttempts();
      const tests = await memoryRepo.listTests();
      
      const inProgressAttempts = allAttempts
        .filter(attempt => attempt.status === 'in_progress')
        .map(attempt => {
          const test = tests.find(t => t.id === attempt.testId);
          const version = test?.versions?.find(v => v.id === attempt.versionId);
          
          const startedAt = new Date(attempt.startedAt);
          const now = new Date();
          const elapsedTime = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
          
          // Calculate total time limit from all sections
          const totalTimeLimit = version?.sections?.reduce((total, section) => 
            total + (section.timeLimit * 60), 0) || 0;
          
          const remainingTime = Math.max(0, totalTimeLimit - elapsedTime);
          const violationCount = attempt.violations?.length || 0;
          
          // Find last activity time (from resume data if available, otherwise started time)
          const lastActivity = attempt.resume?.savedAt || attempt.startedAt;
          
          // Check if lockdown mode is enabled
          const isLockdownMode = version?.examOptions?.lockdownMode || false;
          const lockdownViolations = attempt.violations?.filter(v => v.type === 'lockdown_violation').length || 0;

          return {
            ...attempt,
            test,
            version,
            elapsedTime,
            remainingTime,
            violationCount,
            lastActivity,
            isLockdownMode,
            lockdownViolations,
          } as MonitoringAttempt;
        })
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      setAttempts(inProgressAttempts);
      
      // Update selected attempt if it exists
      if (selectedAttempt) {
        const updatedSelected = inProgressAttempts.find(a => a.id === selectedAttempt.id);
        setSelectedAttempt(updatedSelected || null);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchInProgressAttempts();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(fetchInProgressAttempts, 5000);

    return () => clearInterval(interval);
  }, []);

  // Re-fetch when selectedAttempt changes
  useEffect(() => {
    fetchInProgressAttempts();
  }, [selectedAttempt?.id]);

  return {
    attempts,
    selectedAttempt,
    setSelectedAttempt,
    isLoading,
    refresh: fetchInProgressAttempts,
  };
};
import type { Version } from '@/types/schema';

export interface VersionStats {
  sectionCount: number;
  questionCount: number;
  totalPoints: number;
  totalTimeMinutes: number;
}

export interface TestSection {
  id: string;
  name: string;
  time_limit_minutes: number | null;
  questions?: Array<{
    id: string;
    points: number;
  }>;
}

export interface TestVersion {
  id: string;
  sections?: TestSection[];
}

/**
 * 버전의 통계를 계산합니다
 */
export function calculateVersionStats(version: TestVersion): VersionStats {
  const sections = version.sections || [];
  
  const sectionCount = sections.length;
  
  let questionCount = 0;
  let totalPoints = 0;
  let totalTimeMinutes = 0;
  
  sections.forEach(section => {
    // 문항 수와 총점 계산
    if (section.questions) {
      questionCount += section.questions.length;
      totalPoints += section.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }
    
    // 총 시간 계산
    if (section.time_limit_minutes) {
      totalTimeMinutes += section.time_limit_minutes;
    }
  });
  
  return {
    sectionCount,
    questionCount,
    totalPoints,
    totalTimeMinutes
  };
}

/**
 * 메모리 기반 시스템의 버전 통계를 계산합니다
 */
export function calculateMemoryVersionStats(version: Version): VersionStats {
  const sections = version.sections || [];
  
  const sectionCount = sections.length;
  
  let questionCount = 0;
  let totalPoints = 0;
  let totalTimeMinutes = 0;
  
  sections.forEach(section => {
    // 문항 수와 총점 계산
    if (section.questions) {
      questionCount += section.questions.length;
      totalPoints += section.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }
    
    // 총 시간 계산 (메모리 시스템에서는 timeLimit 속성 사용)
    if (section.timeLimit) {
      totalTimeMinutes += section.timeLimit;
    }
  });
  
  return {
    sectionCount,
    questionCount,
    totalPoints,
    totalTimeMinutes
  };
}

/**
 * Supabase 형태의 섹션 데이터를 변환합니다
 */
export function calculateVersionStatsFromSupabase(sections: Array<{
  id: string;
  name: string;
  time_limit_minutes: number | null;
  question_count?: number;
  test_section_questions?: Array<{
    id: string;
    points: number;
  }>;
}>): VersionStats {
  const sectionCount = sections.length;
  
  let questionCount = 0;
  let totalPoints = 0;
  let totalTimeMinutes = 0;
  
  sections.forEach(section => {
    // 문항 수
    if (section.question_count !== undefined) {
      questionCount += section.question_count;
    } else if (section.test_section_questions) {
      questionCount += section.test_section_questions.length;
      // 총점 계산
      totalPoints += section.test_section_questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }
    
    // 총 시간 계산
    if (section.time_limit_minutes) {
      totalTimeMinutes += section.time_limit_minutes;
    }
  });
  
  return {
    sectionCount,
    questionCount,
    totalPoints,
    totalTimeMinutes
  };
}
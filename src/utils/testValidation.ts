import { Test, TestVersion } from "@/types";
import { calculateMemoryVersionStats } from "./testVersionStats";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 시험 발행 조건을 검증합니다
 */
export function validateTestForPublishing(test: Test): ValidationResult {
  const errors: string[] = [];
  
  // 버전 수 검증 (≥ 1개)
  if (!test.versions || test.versions.length === 0) {
    errors.push("최소 1개의 학년별 버전이 필요합니다.");
    return { isValid: false, errors };
  }
  
  // 각 버전별 검증
  for (const version of test.versions) {
    const versionName = `${version.system} ${version.grade}`;
    
    // 섹션 수 검증 (≥ 1개)
    if (!version.sections || version.sections.length === 0) {
      errors.push(`${versionName} 버전에 최소 1개의 섹션이 필요합니다.`);
      continue;
    }
    
    // 각 섹션별 검증
    for (const section of version.sections) {
      const sectionName = section.label || section.type;
      
      // 문항 수 검증 (≥ 1개)
      if (!section.questions || section.questions.length === 0) {
        errors.push(`${versionName} 버전의 ${sectionName} 섹션에 최소 1개의 문항이 필요합니다.`);
      }
    }
    
    // 통계 검증 (총점 > 0, 총시간 > 0)
    const stats = calculateMemoryVersionStats(version);
    
    if (stats.totalPoints <= 0) {
      errors.push(`${versionName} 버전의 총점이 0보다 커야 합니다.`);
    }
    
    if (stats.totalTimeMinutes <= 0) {
      errors.push(`${versionName} 버전의 총 시간이 0분보다 커야 합니다.`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 시험이 발행 가능한지 간단히 체크합니다
 */
export function canPublishTest(test: Test): boolean {
  return validateTestForPublishing(test).isValid;
}
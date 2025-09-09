import type { TestVersion } from "@/types";

/**
 * TestVersion의 첫 번째 target의 system을 반환
 */
export function getVersionSystem(version: TestVersion): string {
  return version.targets?.[0]?.system || 'KR';
}

/**
 * TestVersion의 첫 번째 target의 첫 번째 grade를 반환
 */
export function getVersionGrade(version: TestVersion): string {
  return version.targets?.[0]?.grades?.[0] || '';
}

/**
 * TestVersion의 모든 targets의 시스템과 학년을 문자열로 반환
 */
export function getVersionLabel(version: TestVersion): string {
  if (!version.targets || version.targets.length === 0) {
    return 'No target';
  }
  
  return version.targets
    .map(target => `${target.system}: ${target.grades.join('·')}`)
    .join(', ');
}
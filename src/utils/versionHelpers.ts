import type { Version, System, Grade } from '@/types/schema';

/**
 * 기존 system/grade 필드를 targets로 마이그레이션하는 호환성 함수
 */
export function normalizeVersion(version: Version): Version {
  // 이미 targets가 있고 유효하면 그대로 반환
  if (version.targets && version.targets.length > 0) {
    return version;
  }

  // 기존 system/grade 필드가 있으면 targets로 변환
  const system = version.system || version.system_type as System;
  const grade = version.grade || version.grade_level;

  if (system && grade) {
    return {
      ...version,
      targets: [{ system, grades: [grade] }]
    };
  }

  // 기본값으로 빈 targets 배열 반환
  return {
    ...version,
    targets: []
  };
}

/**
 * Version의 첫 번째 target의 system을 반환
 */
export function getVersionSystem(version: Version): System {
  const normalized = normalizeVersion(version);
  return normalized.targets[0]?.system || 'KR';
}

/**
 * Version의 첫 번째 target의 첫 번째 grade를 반환
 */
export function getVersionGrade(version: Version): Grade {
  const normalized = normalizeVersion(version);
  return normalized.targets[0]?.grades[0] || '';
}

/**
 * 시스템별 전체 학년 목록 반환
 */
export function allGradesBySystem(system: System): Grade[] {
  switch (system) {
    case 'KR':
      return ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
    case 'US':
      return ['GK', ...Array.from({ length: 12 }, (_, i) => `G${i + 1}`)]; // GK, G1~G12
    case 'UK':
      return Array.from({ length: 13 }, (_, i) => `Yr${i + 1}`); // Yr1~Yr13
    default:
      return [];
  }
}

/**
 * Target 배열을 사용자 친화적 문자열로 포맷
 * 예: "KR: 초2·초3 / US: G2 / UK: Yr3"
 */
export function formatTargets(targets: Array<{ system: System; grades: Grade[] }>): string {
  if (!targets || targets.length === 0) {
    return '대상 없음';
  }

  return targets
    .map(target => `${target.system}: ${target.grades.join('·')}`)
    .join(' / ');
}

/**
 * Version의 모든 targets를 포맷된 문자열로 반환
 */
export function getVersionLabel(version: Version): string {
  const normalized = normalizeVersion(version);
  return formatTargets(normalized.targets);
}
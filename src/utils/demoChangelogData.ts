import { logEvent } from './changelogUtils';

// Demo function to create initial changelog entries
export const seedDemoChangelogData = () => {
  // Only run if there are no existing entries
  const existing = localStorage.getItem('tn_academy_changelog');
  if (existing && JSON.parse(existing).length > 0) {
    return;
  }

  // Add some demo entries with various timestamps over the past week
  const now = new Date();
  
  // Entry from 5 minutes ago
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  logEvent('tests', 'publish', '중학교 영어 진단평가 V1.2 발행', '총 45문항, 4개 섹션으로 구성된 진단평가를 공개 상태로 변경');
  
  // Entry from 2 hours ago
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('sections', 'create', '리스닝 섹션 추가 - 고등학교 모의고사', '10문항의 객관식 문제로 구성, MP3 파일 업로드 완료');
  }, 100);
  
  // Entry from yesterday  
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('assignments', 'deploy', '서울 A중학교 2학년 진단평가 배정', '총 120명 학생 대상, 12월 20일까지 응시 기간 설정');
  }, 200);
  
  // Entry from 2 days ago
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('tokens', 'create', '학부모 결과 확인 토큰 50개 생성', '12월 진단평가 결과 확인용 토큰 일괄 발급');
  }, 300);
  
  // Entry from 3 days ago
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('questions', 'update', '리딩 문제 난이도 조정', '지문 길이 단축 및 보기 개선으로 문제 완성도 향상');
  }, 400);
  
  // Entry from 4 days ago
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('backup', 'export', '주간 백업 데이터 생성', 'JSON 형식으로 전체 시험 데이터 및 응시 기록 백업 완료');
  }, 500);
  
  // Entry from a week ago
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  setTimeout(() => {
    logEvent('settings', 'update', '자동 채점 설정 변경', '단답형 문제 오타 허용도 2자에서 1자로 엄격하게 조정');
  }, 600);
};
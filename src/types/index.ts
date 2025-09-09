import type { Question } from './schema';

// 새로운 통일된 스키마 사용  
export * from './schema';

export type QuestionBankItem = Question & {
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
};

export type RubricCriterion = {
  key: 'fluency' | 'pronunciation' | 'grammar' | 'content';
  score: number; // 0-4
  weight: number; // percentage
};

export type SpeakingRubric = {
  criteria: RubricCriterion[];
  comment: string;
};

export type SpeakingReview = {
  questionId: string;
  manualScore: number;
  comment: string;
  rubric?: SpeakingRubric;
};

// 채점 프로필 타입
export type MCQScoringConfig = {
  defaultPoints: number;
  wrongPenalty?: number; // 오답 감점 (옵션)
};

export type ShortAnswerProcessingRule = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  typoTolerance: number; // 0-3 허용 오타 수
  regexPatterns: string[]; // 정답으로 인정할 정규식 목록
};

export type SpeakingRubricItem = {
  id: string;
  label: string;
  description: string;
  weight: number; // 0-100 퍼센트
  maxScore: number; // 최대점수 (보통 4점)
};

export type ScoringProfile = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  
  // MCQ 채점 설정
  mcqConfig: MCQScoringConfig;
  
  // Short Answer 채점 설정
  shortConfig: ShortAnswerProcessingRule;
  
  // Speaking 루브릭 설정
  speakingRubrics: SpeakingRubricItem[];
};

// 배치 권고 관련 타입
export type PlacementLevel = 'Starter' | 'Basic' | 'Intermediate' | 'Advanced';

export type PlacementCriteria = {
  level: PlacementLevel;
  minTotalScore: number; // 총점 최소 점수
  minSpeakingScore?: number; // 스피킹 최소 점수 (선택)
  description: string;
};

export type PlacementConfig = {
  id: string;
  name: string;
  description?: string;
  criteria: PlacementCriteria[];
  isDefault: boolean;
  createdAt: string;
};

export type PlacementRecommendation = {
  level: PlacementLevel;
  totalScore: number;
  maxTotalScore: number;
  speakingScore?: number;
  maxSpeakingScore?: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
};

export type TestAttempt = {
  id: string;
  testId: string;
  versionId: string;
  startedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'submitted';
  reviewStatus?: 'pending' | 'completed';
  candidate?: {
    name: string;
    system: 'KR' | 'US' | 'UK';
    grade: string;
    phone?: string;
    note?: string;
  };
  answers?: Record<string, string>; // questionId -> response
  audioAnswers?: Record<string, string>; // questionId -> audioUrl (blob URL)
  submittedAt?: string;
  autoTotal?: number;
  maxTotal?: number;
  humanTotal?: number;
  finalTotal?: number;
  speakingReviews?: SpeakingReview[];
  rubric?: Record<string, SpeakingRubric>; // questionId -> rubric
  scoringProfileId?: string; // 사용된 채점 프로필 ID
  autoSpeaking?: Record<string, {
    transcript: string;
    wpm: number;
    speakingTime: number;
    pauses: number;
    fillers: number;
    ttr: number;
    scores: {
      fluency: number;
      pronunciation: number;
      grammar: number;
      content: number;
    };
    scoredAt: string;
  }>; // questionId -> auto speaking results
  preflight?: {
    mic: boolean;
    record: boolean;
    play: boolean;
    net: {
      downKbps: number;
      upKbps: number;
    };
    checkedAt: string;
  };
  violations?: Array<{
    at: string; // ISO timestamp
    type: 'blur' | 'visibility' | 'lockdown_violation';
    details?: string; // Additional details for lockdown violations
  }>;
  resume?: {
    sectionIndex: number;
    questionIndex: number;
    remainingSeconds: number;
    savedAt: string;
  };
  layout?: {
    seed: number; // 고정 시드
    shuffledQuestions?: Array<{
      sectionId: string;
      originalIndex: number;
      shuffledIndex: number;
    }>;
    shuffledChoices?: Record<string, number[]>; // questionId -> shuffled choice indices
  };
};

export type { ChangelogEntry } from './changelog';
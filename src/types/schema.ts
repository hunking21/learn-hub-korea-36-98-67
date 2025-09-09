// 통일된 스키마 - 전역에서 이 타입만 사용
export type System = 'KR' | 'US' | 'UK';
export type Grade = string; // KR: 초1~고3, US: GK|G1~G12, UK: Yr1~Yr13  
export type SectionType = 'Listening' | 'Reading' | 'Speaking' | 'Writing' | 'Instruction' | 'Passage' | 'Custom';
export type QuestionType = 'MCQ' | 'Short' | 'Speaking' | 'Writing' | 'Instruction' | 'Passage';

export interface Target { 
  system: System; 
  grades: Grade[]; 
}

export interface Question { 
  id: string; 
  type: QuestionType; 
  prompt?: string; 
  choices?: string[]; 
  answer?: number | string | string[]; 
  points: number; 
  createdAt: string; 
  passageId?: string;
  // 기존 필드들 호환성 유지
  writingSettings?: {
    maxWords?: number;
    minWords?: number;
    useRubric?: boolean;
    rubricItems?: string[];
  };
  isInstructionOnly?: boolean;
  passageContent?: string;
}

export interface Section { 
  id: string; 
  label: string; 
  type: SectionType; 
  timeLimit: number; // Required for proper stats calculation
  settings?: Record<string, unknown>; 
  questions?: Question[]; 
  createdAt: string;
  scoringProfileId?: string;
}

export interface VersionOptions { 
  shuffleQuestions?: boolean; 
  shuffleChoices?: boolean; 
  allowBack?: boolean; 
  oneByOne?: boolean; 
  lockMode?: boolean;
}

// 기존 examOptions와 호환성을 위한 별칭
export interface ExamOptions {
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  allowBacktrack?: boolean;
  oneQuestionPerPage?: boolean;
  lockdownMode?: boolean;
}

export interface Version { 
  id: string; 
  targets: Target[]; 
  sections?: Section[]; 
  options?: VersionOptions; 
  createdAt: string;
  scoringProfileId?: string;
  // 기존 examOptions 필드 호환성
  examOptions?: ExamOptions;
  // 기존 필드들 - 마이그레이션 용도로만 사용
  system?: System;
  grade?: Grade;
  grade_level?: string;
  system_type?: string;
}

export interface Test { 
  id: string; 
  name: string; 
  description?: string; 
  status: 'Draft' | 'Published'; 
  versions?: Version[]; 
  createdAt: string;
  assignments?: TestAssignment[];
  scoringProfileId?: string;
}

export interface TestAssignment {
  id: string;
  system: System;
  grades: Grade[];
  startAt: string;
  endAt: string;
  createdAt: string;
}

// 기존 타입들과의 호환성을 위한 별칭
export type TestVersion = Version;
export type TestSection = Section;
// Result token management for parent access to student results

export interface ResultToken {
  value: string;
  attemptId: string;
  studentId: string;
  testId: string;
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface StudentTestAttempt {
  id: string;
  studentId: string;
  studentName: string;
  testId: string;
  testName: string;
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  resultToken?: ResultToken;
  sections?: {
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
}

const RESULT_TOKENS_KEY = 'tn_academy_result_tokens';
const TEST_ATTEMPTS_KEY = 'tn_academy_test_attempts';

class ResultTokenManager {
  private tokens: Map<string, ResultToken> = new Map();
  private attempts: Map<string, StudentTestAttempt> = new Map();

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  private loadFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem(RESULT_TOKENS_KEY);
      if (storedTokens) {
        const tokenArray: ResultToken[] = JSON.parse(storedTokens);
        tokenArray.forEach(token => {
          this.tokens.set(token.value, token);
        });
      }

      const storedAttempts = localStorage.getItem(TEST_ATTEMPTS_KEY);
      if (storedAttempts) {
        const attemptArray: StudentTestAttempt[] = JSON.parse(storedAttempts);
        attemptArray.forEach(attempt => {
          this.attempts.set(attempt.id, attempt);
        });
      }
    } catch (error) {
      console.error('Failed to load result tokens from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const tokenArray = Array.from(this.tokens.values());
      const attemptArray = Array.from(this.attempts.values());
      
      localStorage.setItem(RESULT_TOKENS_KEY, JSON.stringify(tokenArray));
      localStorage.setItem(TEST_ATTEMPTS_KEY, JSON.stringify(attemptArray));
    } catch (error) {
      console.error('Failed to save result tokens to storage:', error);
    }
  }

  private initializeMockData(): void {
    // Initialize with some mock test attempts if none exist
    if (this.attempts.size === 0) {
      const mockAttempts: StudentTestAttempt[] = [
        {
          id: 'attempt_001',
          studentId: 'student_001',
          studentName: '김민수',
          testId: 'test_001',
          testName: '중간고사 영어 시험',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          score: 85,
          maxScore: 100,
          percentage: 85,
          grade: 'B+',
          sections: [
            { name: '듣기', score: 18, maxScore: 20, percentage: 90 },
            { name: '읽기', score: 22, maxScore: 25, percentage: 88 },
            { name: '쓰기', score: 20, maxScore: 25, percentage: 80 },
            { name: '문법', score: 25, maxScore: 30, percentage: 83 }
          ]
        },
        {
          id: 'attempt_002',
          studentId: 'student_002',
          studentName: '이지은',
          testId: 'test_002',
          testName: '기말고사 수학 시험',
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          score: 92,
          maxScore: 100,
          percentage: 92,
          grade: 'A',
          sections: [
            { name: '대수', score: 23, maxScore: 25, percentage: 92 },
            { name: '기하', score: 22, maxScore: 25, percentage: 88 },
            { name: '확률과 통계', score: 24, maxScore: 25, percentage: 96 },
            { name: '해석', score: 23, maxScore: 25, percentage: 92 }
          ]
        }
      ];

      mockAttempts.forEach(attempt => {
        this.attempts.set(attempt.id, attempt);
      });
      this.saveToStorage();
    }
  }

  generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createResultToken(attemptId: string, expiryDays: number = 30): ResultToken | null {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return null;

    // Revoke existing token if any
    if (attempt.resultToken) {
      this.revokeToken(attempt.resultToken.value);
    }

    const tokenValue = this.generateToken();
    const now = new Date();
    const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    const token: ResultToken = {
      value: tokenValue,
      attemptId,
      studentId: attempt.studentId,
      testId: attempt.testId,
      issuedAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      isActive: true
    };

    this.tokens.set(tokenValue, token);
    
    // Update attempt with token
    attempt.resultToken = token;
    this.attempts.set(attemptId, attempt);
    
    this.saveToStorage();
    return token;
  }

  validateToken(tokenValue: string): { isValid: boolean; token?: ResultToken; error?: string } {
    const token = this.tokens.get(tokenValue);
    
    if (!token) {
      return { isValid: false, error: '유효하지 않은 토큰입니다.' };
    }

    if (!token.isActive) {
      return { isValid: false, error: '비활성화된 토큰입니다.' };
    }

    if (new Date(token.expiresAt) < new Date()) {
      return { isValid: false, error: '만료된 토큰입니다.' };
    }

    return { isValid: true, token };
  }

  getAttemptByToken(tokenValue: string): StudentTestAttempt | null {
    const tokenValidation = this.validateToken(tokenValue);
    if (!tokenValidation.isValid || !tokenValidation.token) {
      return null;
    }

    return this.attempts.get(tokenValidation.token.attemptId) || null;
  }

  revokeToken(tokenValue: string): boolean {
    const token = this.tokens.get(tokenValue);
    if (!token) return false;

    token.isActive = false;
    this.tokens.set(tokenValue, token);

    // Update attempt to remove token reference
    const attempt = this.attempts.get(token.attemptId);
    if (attempt && attempt.resultToken?.value === tokenValue) {
      attempt.resultToken = undefined;
      this.attempts.set(attempt.id, attempt);
    }

    this.saveToStorage();
    return true;
  }

  getAllAttempts(): StudentTestAttempt[] {
    return Array.from(this.attempts.values());
  }

  getAttemptById(attemptId: string): StudentTestAttempt | null {
    return this.attempts.get(attemptId) || null;
  }

  generateResultUrl(tokenValue: string): string {
    return `${window.location.origin}/r/${tokenValue}`;
  }
}

export const resultTokenManager = new ResultTokenManager();
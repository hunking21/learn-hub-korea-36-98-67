import type { Test, TestAttempt, ScoringProfile } from '@/types';
import type { QuestionBankItem } from '@/types';

// localStorage 키 (v1.0 - 고정된 통합 키)
const STORAGE_KEYS = {
  MAIN: 'app_store_v1', // 통합 스토어 키
  TESTS: 'tn_academy_tests',
  ATTEMPTS: 'tn_academy_attempts',
  QUESTION_BANK: 'tn_academy_question_bank',
  SCORING_PROFILES: 'tn_academy_scoring_profiles',
} as const;

// 레거시 키들 (마이그레이션 대상)
const LEGACY_KEYS = [
  'localStore',
  'app_store',
  'tn_academy_data',
  'tn_academy_store',
  // 이전 개별 키들
  'tn_academy_tests',
  'tn_academy_attempts',
  'tn_academy_question_bank',
  'tn_academy_scoring_profiles'
] as const;

// 자동 백업 설정
export interface AutoBackupSettings {
  enabled: boolean;
  interval: '10min' | '1hour' | '1day';
  maxBackups: number;
}

// 백업 아이템 타입
export interface BackupItem {
  key: string;
  timestamp: string;
  size: number;
  dataPreview: {
    tests: number;
    attempts: number;
    questionBank: number;
    scoringProfiles: number;
  };
  data: StoreState & { version: string; savedAt: string };
}

// 데이터 병합 옵션
export interface DataMergeOptions {
  strategy: 'merge' | 'replace';
  selectedFields: string[];
}

// 스토어 상태 타입
interface StoreState {
  tests: Test[];
  attempts: TestAttempt[];
  questionBank: QuestionBankItem[];
  scoringProfiles: ScoringProfile[];
}

// 레거시 데이터 타입
export interface LegacyDataCandidate {
  key: string;
  size: number;
  lastModified: string;
  dataFields: string[];
  preview: {
    tests?: number;
    attempts?: number;
    users?: number;
    assignments?: number;
    questionBank?: number;
    scoringProfiles?: number;
  };
  rawData: any;
}

// 초기 상태
const initialState: StoreState = {
  tests: [],
  attempts: [],
  questionBank: [],
  scoringProfiles: [],
};

// 데이터 타입 감지를 위한 필드들
const DATA_FIELD_PATTERNS = {
  users: /users|students|teachers|admins/i,
  tests: /tests|exams|assessments/i,
  assignments: /assignments|tasks/i,
  attempts: /attempts|results|submissions/i,
  questionBank: /question_bank|questions|items/i,
  scoringProfiles: /scoring_profiles|profiles|rubrics/i
} as const;

// 백업 관련 상수
const BACKUP_KEY_PREFIX = 'app_backup_v1:';
const BACKUP_LOCK_KEY = 'app_backup_lock';
const BACKUP_SETTINGS_KEY = 'app_backup_settings';

class LocalStore {
  private state: StoreState;
  private listeners: Set<() => void> = new Set();
  private backupInterval: NodeJS.Timeout | null = null;
  private backupSettings: AutoBackupSettings = {
    enabled: false,
    interval: '1hour',
    maxBackups: 20
  };

  constructor() {
    // 백업 설정 로드
    this.loadBackupSettings();
    
    // 레거시 데이터 마이그레이션 (1회)
    this.performLegacyMigration();
    
    // localStorage에서 초기 데이터 복원
    this.state = this.loadFromStorage();
    
    // 자동 백업 시작
    this.startAutoBackup();
    
    // 브라우저 탭이 닫히거나 새로고침될 때 자동 저장 및 백업
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
      if (this.backupSettings.enabled) {
        this.createBackup();
      }
    });

    // 주기적으로 자동 저장 (5초마다)
    setInterval(() => {
      this.saveToStorage();
    }, 5000);
  }

  private createDefaultScoringProfiles(): ScoringProfile[] {
    return [{
      id: crypto.randomUUID(),
      name: '기본 채점 프로필',
      description: '시스템 기본 채점 설정',
      isDefault: true,
      createdAt: new Date().toISOString(),
      mcqConfig: {
        defaultPoints: 1,
        wrongPenalty: 0
      },
      shortConfig: {
        ignoreWhitespace: true,
        ignoreCase: true,
        typoTolerance: 1,
        regexPatterns: []
      },
      speakingRubrics: [
        {
          id: crypto.randomUUID(),
          label: '유창성',
          description: '말하기 유창성 평가',
          weight: 25,
          maxScore: 4
        },
        {
          id: crypto.randomUUID(),
          label: '발음',
          description: '발음의 정확성',
          weight: 25,
          maxScore: 4
        },
        {
          id: crypto.randomUUID(),
          label: '문법',
          description: '문법적 정확성',
          weight: 25,
          maxScore: 4
        },
        {
          id: crypto.randomUUID(),
          label: '내용',
          description: '내용의 적절성과 완성도',
          weight: 25,
          maxScore: 4
        }
      ]
    }];
  }

  private loadFromStorage(): StoreState {
    try {
      // 우선 통합 스토어에서 로드 시도
      const mainStoreJson = localStorage.getItem(STORAGE_KEYS.MAIN);
      if (mainStoreJson) {
        const mainStore = JSON.parse(mainStoreJson);
        return {
          tests: mainStore.tests || [],
          attempts: mainStore.attempts || [],
          questionBank: mainStore.questionBank || [],
          scoringProfiles: mainStore.scoringProfiles || this.createDefaultScoringProfiles(),
        };
      }

      // 개별 키에서 로드 (레거시)
      const testsJson = localStorage.getItem(STORAGE_KEYS.TESTS);
      const attemptsJson = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      const questionBankJson = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
      const scoringProfilesJson = localStorage.getItem(STORAGE_KEYS.SCORING_PROFILES);
      
      return {
        tests: testsJson ? JSON.parse(testsJson) : [],
        attempts: attemptsJson ? JSON.parse(attemptsJson) : [],
        questionBank: questionBankJson ? JSON.parse(questionBankJson) : [],
        scoringProfiles: scoringProfilesJson ? JSON.parse(scoringProfilesJson) : this.createDefaultScoringProfiles(),
      };
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return {
        ...initialState,
        scoringProfiles: this.createDefaultScoringProfiles()
      };
    }
  }

  private saveToStorage(): void {
    try {
      // 통합 스토어에 저장
      const storeData = {
        tests: this.state.tests,
        attempts: this.state.attempts,
        questionBank: this.state.questionBank,
        scoringProfiles: this.state.scoringProfiles,
        version: '1.0',
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.MAIN, JSON.stringify(storeData));
      
      // 레거시 키들도 유지 (호환성)
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(this.state.tests));
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(this.state.attempts));
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(this.state.questionBank));
      localStorage.setItem(STORAGE_KEYS.SCORING_PROFILES, JSON.stringify(this.state.scoringProfiles));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // 구독/해제
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 상태 접근자
  getTests(): Test[] {
    return [...this.state.tests];
  }

  getAttempts(): TestAttempt[] {
    return [...this.state.attempts];
  }

  getQuestionBank(): QuestionBankItem[] {
    return [...this.state.questionBank];
  }

  getScoringProfiles(): ScoringProfile[] {
    return [...this.state.scoringProfiles];
  }

  getDefaultScoringProfile(): ScoringProfile | undefined {
    return this.state.scoringProfiles.find(profile => profile.isDefault);
  }

  // Tests 관리
  setTests(tests: Test[]): void {
    this.state.tests = tests;
    this.saveToStorage();
    this.notifyListeners();
  }

  addTest(test: Test): void {
    this.state.tests.unshift(test);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateTest(id: string, updater: (test: Test) => Test): boolean {
    const index = this.state.tests.findIndex(test => test.id === id);
    if (index !== -1) {
      this.state.tests[index] = updater(this.state.tests[index]);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteTest(id: string): boolean {
    const initialLength = this.state.tests.length;
    this.state.tests = this.state.tests.filter(test => test.id !== id);
    if (this.state.tests.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Attempts 관리
  setAttempts(attempts: TestAttempt[]): void {
    this.state.attempts = attempts;
    this.saveToStorage();
    this.notifyListeners();
  }

  addAttempt(attempt: TestAttempt): void {
    this.state.attempts.push(attempt);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateAttempt(id: string, updater: (attempt: TestAttempt) => TestAttempt): boolean {
    const index = this.state.attempts.findIndex(attempt => attempt.id === id);
    if (index !== -1) {
      this.state.attempts[index] = updater(this.state.attempts[index]);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteAttempt(id: string): boolean {
    const initialLength = this.state.attempts.length;
    this.state.attempts = this.state.attempts.filter(attempt => attempt.id !== id);
    if (this.state.attempts.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Scoring Profiles 관리
  setScoringProfiles(profiles: ScoringProfile[]): void {
    this.state.scoringProfiles = profiles;
    this.saveToStorage();
    this.notifyListeners();
  }

  addScoringProfile(profile: ScoringProfile): void {
    // 새로 추가하는 프로필이 기본으로 설정되면 기존 기본 해제
    if (profile.isDefault) {
      this.state.scoringProfiles.forEach(p => p.isDefault = false);
    }
    this.state.scoringProfiles.push(profile);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateScoringProfile(id: string, updater: (profile: ScoringProfile) => ScoringProfile): boolean {
    const index = this.state.scoringProfiles.findIndex(profile => profile.id === id);
    if (index !== -1) {
      const updatedProfile = updater(this.state.scoringProfiles[index]);
      
      // 기본 프로필로 설정되면 기존 기본 해제
      if (updatedProfile.isDefault) {
        this.state.scoringProfiles.forEach((p, i) => {
          if (i !== index) p.isDefault = false;
        });
      }
      
      this.state.scoringProfiles[index] = updatedProfile;
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteScoringProfile(id: string): boolean {
    const profile = this.state.scoringProfiles.find(p => p.id === id);
    
    // 기본 프로필은 삭제할 수 없음
    if (profile?.isDefault) {
      return false;
    }
    
    const initialLength = this.state.scoringProfiles.length;
    this.state.scoringProfiles = this.state.scoringProfiles.filter(profile => profile.id !== id);
    
    if (this.state.scoringProfiles.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  cloneScoringProfile(id: string, newName: string): ScoringProfile | null {
    const originalProfile = this.state.scoringProfiles.find(p => p.id === id);
    if (!originalProfile) return null;

    const clonedProfile: ScoringProfile = {
      ...originalProfile,
      id: crypto.randomUUID(),
      name: newName,
      isDefault: false,
      createdAt: new Date().toISOString(),
      speakingRubrics: originalProfile.speakingRubrics.map(rubric => ({
        ...rubric,
        id: crypto.randomUUID()
      }))
    };

    this.state.scoringProfiles.push(clonedProfile);
    this.saveToStorage();
    this.notifyListeners();
    return clonedProfile;
  }

  setDefaultScoringProfile(id: string): boolean {
    const targetProfile = this.state.scoringProfiles.find(p => p.id === id);
    if (!targetProfile) return false;

    // 모든 프로필을 기본이 아닌 것으로 설정
    this.state.scoringProfiles.forEach(profile => {
      profile.isDefault = profile.id === id;
    });

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 레거시 데이터 마이그레이션 (1회 실행)
  private performLegacyMigration(): void {
    const migrationKey = 'app_store_migration_v1_done';
    
    // 이미 마이그레이션을 수행했다면 건너뛰기
    if (localStorage.getItem(migrationKey)) {
      return;
    }

    console.log('🔄 레거시 데이터 마이그레이션 시작...');
    
    try {
      const legacyData = this.scanLegacyData();
      
      if (legacyData.length > 0) {
        console.log(`📦 ${legacyData.length}개의 레거시 데이터 발견`);
        
        // 가장 최신 데이터를 찾아서 자동 마이그레이션
        const latestData = legacyData.sort((a, b) => 
          new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        )[0];
        
        if (latestData && this.validateLegacyData(latestData.rawData)) {
          console.log(`✅ ${latestData.key}에서 데이터 마이그레이션 중...`);
          this.mergeLegacyData(latestData.rawData, { strategy: 'merge', selectedFields: ['tests', 'attempts', 'questionBank', 'scoringProfiles'] });
        }
      }
      
      // 마이그레이션 완료 플래그 설정
      localStorage.setItem(migrationKey, new Date().toISOString());
      console.log('✅ 레거시 데이터 마이그레이션 완료');
    } catch (error) {
      console.warn('⚠️ 레거시 데이터 마이그레이션 실패:', error);
    }
  }

  // localStorage의 모든 키를 스캔하여 데이터 후보 찾기
  scanLegacyData(): LegacyDataCandidate[] {
    const candidates: LegacyDataCandidate[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === STORAGE_KEYS.MAIN) continue;
      
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const data = JSON.parse(value);
        const dataFields = this.detectDataFields(data);
        
        // 관련 필드가 있는 경우만 후보로 추가
        if (dataFields.length > 0) {
          candidates.push({
            key,
            size: new Blob([value]).size,
            lastModified: this.getDataTimestamp(data) || new Date().toISOString(),
            dataFields,
            preview: this.generateDataPreview(data),
            rawData: data
          });
        }
      } catch (error) {
        // JSON 파싱 실패한 키는 무시
        continue;
      }
    }
    
    return candidates.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  private detectDataFields(data: any): string[] {
    const fields: string[] = [];
    
    if (typeof data !== 'object' || !data) return fields;
    
    for (const [fieldType, pattern] of Object.entries(DATA_FIELD_PATTERNS)) {
      const hasMatchingField = Object.keys(data).some(key => 
        pattern.test(key) || (Array.isArray(data[key]) && data[key].length > 0)
      );
      
      if (hasMatchingField) {
        fields.push(fieldType);
      }
    }
    
    return fields;
  }

  private generateDataPreview(data: any): LegacyDataCandidate['preview'] {
    const preview: LegacyDataCandidate['preview'] = {};
    
    if (typeof data !== 'object' || !data) return preview;
    
    // 직접 배열인 경우
    if (Array.isArray(data)) {
      return { tests: data.length };
    }
    
    // 객체의 각 필드를 검사
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        const count = value.length;
        
        if (DATA_FIELD_PATTERNS.tests.test(key)) {
          preview.tests = count;
        } else if (DATA_FIELD_PATTERNS.attempts.test(key)) {
          preview.attempts = count;
        } else if (DATA_FIELD_PATTERNS.users.test(key)) {
          preview.users = count;
        } else if (DATA_FIELD_PATTERNS.assignments.test(key)) {
          preview.assignments = count;
        } else if (DATA_FIELD_PATTERNS.questionBank.test(key)) {
          preview.questionBank = count;
        } else if (DATA_FIELD_PATTERNS.scoringProfiles.test(key)) {
          preview.scoringProfiles = count;
        }
      }
    }
    
    return preview;
  }

  private getDataTimestamp(data: any): string | null {
    if (typeof data !== 'object' || !data) return null;
    
    // 공통적인 타임스탬프 필드들 검사
    const timestampFields = ['savedAt', 'updatedAt', 'createdAt', 'timestamp', 'lastModified'];
    
    for (const field of timestampFields) {
      if (data[field]) {
        return data[field];
      }
    }
    
    // 배열 데이터에서 최신 타임스탬프 찾기
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0) {
        const latestItem = value.reduce((latest, item) => {
          if (typeof item === 'object' && item) {
            for (const field of timestampFields) {
              if (item[field] && (!latest || new Date(item[field]) > new Date(latest))) {
                return item[field];
              }
            }
          }
          return latest;
        }, null);
        
        if (latestItem) return latestItem;
      }
    }
    
    return null;
  }

  private validateLegacyData(data: any): boolean {
    if (typeof data !== 'object' || !data) return false;
    
    // 최소한 하나의 유효한 배열 필드가 있어야 함
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  // 레거시 데이터 병합
  mergeLegacyData(legacyData: any, options: DataMergeOptions): void {
    if (!this.validateLegacyData(legacyData)) {
      throw new Error('유효하지 않은 레거시 데이터입니다.');
    }

    if (options.strategy === 'replace') {
      // 전체 교체
      this.state = {
        tests: this.extractArrayField(legacyData, 'tests') || [],
        attempts: this.extractArrayField(legacyData, 'attempts') || [],
        questionBank: this.extractArrayField(legacyData, 'questionBank') || [],
        scoringProfiles: this.extractArrayField(legacyData, 'scoringProfiles') || this.createDefaultScoringProfiles(),
      };
    } else {
      // 병합 (같은 id는 현재값 유지, 누락만 추가)
      if (options.selectedFields.includes('tests')) {
        this.state.tests = this.mergeArrayById(this.state.tests, this.extractArrayField(legacyData, 'tests') || []);
      }
      if (options.selectedFields.includes('attempts')) {
        this.state.attempts = this.mergeArrayById(this.state.attempts, this.extractArrayField(legacyData, 'attempts') || []);
      }
      if (options.selectedFields.includes('questionBank')) {
        this.state.questionBank = this.mergeArrayById(this.state.questionBank, this.extractArrayField(legacyData, 'questionBank') || []);
      }
      if (options.selectedFields.includes('scoringProfiles')) {
        this.state.scoringProfiles = this.mergeArrayById(this.state.scoringProfiles, this.extractArrayField(legacyData, 'scoringProfiles') || []);
      }
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  private extractArrayField(data: any, fieldType: string): any[] | null {
    if (!data || typeof data !== 'object') return null;
    
    const pattern = DATA_FIELD_PATTERNS[fieldType as keyof typeof DATA_FIELD_PATTERNS];
    if (!pattern) return null;
    
    // 직접 배열인 경우
    if (Array.isArray(data) && fieldType === 'tests') {
      return data;
    }
    
    // 객체에서 해당 필드 찾기
    for (const [key, value] of Object.entries(data)) {
      if (pattern.test(key) && Array.isArray(value)) {
        return value;
      }
    }
    
    return null;
  }

  private mergeArrayById(current: any[], incoming: any[]): any[] {
    const currentIds = new Set(current.map(item => item.id));
    const newItems = incoming.filter(item => item.id && !currentIds.has(item.id));
    return [...current, ...newItems];
  }


  // 자동 백업 관리
  private loadBackupSettings(): void {
    try {
      const settingsJson = localStorage.getItem(BACKUP_SETTINGS_KEY);
      if (settingsJson) {
        this.backupSettings = { ...this.backupSettings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.warn('백업 설정 로드 실패:', error);
    }
  }

  private saveBackupSettings(): void {
    try {
      localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(this.backupSettings));
    } catch (error) {
      console.warn('백업 설정 저장 실패:', error);
    }
  }

  getAutoBackupSettings(): AutoBackupSettings {
    return { ...this.backupSettings };
  }

  updateAutoBackupSettings(settings: Partial<AutoBackupSettings>): void {
    this.backupSettings = { ...this.backupSettings, ...settings };
    this.saveBackupSettings();
    
    // 자동 백업 재시작
    this.stopAutoBackup();
    if (this.backupSettings.enabled) {
      this.startAutoBackup();
    }
  }

  private startAutoBackup(): void {
    if (!this.backupSettings.enabled) return;
    
    this.stopAutoBackup();
    
    const intervals = {
      '10min': 10 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000
    };
    
    const interval = intervals[this.backupSettings.interval];
    
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, interval);
    
    console.log(`🔄 자동 백업 시작됨 (주기: ${this.backupSettings.interval})`);
  }

  private stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  createBackup(): boolean {
    try {
      // 락 확인 (동일 탭 중복 방지)
      const lockKey = `${BACKUP_LOCK_KEY}:${Date.now()}`;
      const existingLock = localStorage.getItem(BACKUP_LOCK_KEY);
      
      if (existingLock) {
        const lockTime = parseInt(existingLock);
        const now = Date.now();
        // 5분 이내의 락은 유효
        if (now - lockTime < 5 * 60 * 1000) {
          return false;
        }
      }
      
      // 락 설정
      localStorage.setItem(BACKUP_LOCK_KEY, Date.now().toString());
      
      const timestamp = new Date().toISOString();
      const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
      
      const backupData = {
        ...this.state,
        version: '1.0',
        savedAt: timestamp
      };
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // 오래된 백업 정리
      this.cleanupOldBackups();
      
      // 락 해제
      localStorage.removeItem(BACKUP_LOCK_KEY);
      
      console.log(`💾 백업 생성됨: ${backupKey}`);
      return true;
    } catch (error) {
      console.warn('백업 생성 실패:', error);
      localStorage.removeItem(BACKUP_LOCK_KEY);
      return false;
    }
  }

  private cleanupOldBackups(): void {
    try {
      const backups = this.getBackupList();
      
      if (backups.length > this.backupSettings.maxBackups) {
        const toDelete = backups.slice(this.backupSettings.maxBackups);
        
        toDelete.forEach(backup => {
          localStorage.removeItem(backup.key);
        });
        
        console.log(`🗑️ ${toDelete.length}개의 오래된 백업 삭제됨`);
      }
    } catch (error) {
      console.warn('백업 정리 실패:', error);
    }
  }

  getBackupList(): BackupItem[] {
    const backups: BackupItem[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith(BACKUP_KEY_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (!value) continue;
          
          const data = JSON.parse(value);
          const timestamp = key.replace(BACKUP_KEY_PREFIX, '');
          
          backups.push({
            key,
            timestamp,
            size: new Blob([value]).size,
            dataPreview: {
              tests: data.tests?.length || 0,
              attempts: data.attempts?.length || 0,
              questionBank: data.questionBank?.length || 0,
              scoringProfiles: data.scoringProfiles?.length || 0
            },
            data
          });
        } catch (error) {
          // 잘못된 백업 데이터는 무시
          continue;
        }
      }
    }
    
    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  restoreFromBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('백업 데이터를 찾을 수 없습니다.');
      }
      
      const data = JSON.parse(backupData);
      
      this.state = {
        tests: data.tests || [],
        attempts: data.attempts || [],
        questionBank: data.questionBank || [],
        scoringProfiles: data.scoringProfiles || this.createDefaultScoringProfiles()
      };
      
      this.saveToStorage();
      this.notifyListeners();
      
      // 복원 후 즉시 백업 생성
      this.createBackup();
      
      return true;
    } catch (error) {
      console.error('백업 복원 실패:', error);
      return false;
    }
  }

  deleteBackup(backupKey: string): boolean {
    try {
      localStorage.removeItem(backupKey);
      return true;
    } catch (error) {
      console.error('백업 삭제 실패:', error);
      return false;
    }
  }

  exportBackupsAsZip(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // JSZip이 없는 경우 간단한 JSON 내보내기로 대체
        const backups = this.getBackupList();
        const exportData = {
          backups: backups.map(backup => ({
            timestamp: backup.timestamp,
            data: backup.data
          })),
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 전체 데이터 초기화 (백업 포함)
  clearAll(): void {
    // 초기화 전 마지막 백업
    if (this.backupSettings.enabled) {
      this.createBackup();
    }
    
    this.state = { ...initialState, scoringProfiles: this.createDefaultScoringProfiles() };
    localStorage.removeItem(STORAGE_KEYS.MAIN);
    localStorage.removeItem(STORAGE_KEYS.TESTS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.QUESTION_BANK);
    localStorage.removeItem(STORAGE_KEYS.SCORING_PROFILES);
    this.notifyListeners();
  }

  // 데이터 백업 - 전체 상태를 JSON으로 내보내기
  exportData(): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        tests: this.state.tests,
        attempts: this.state.attempts
      }
    };
    return JSON.stringify(exportData, null, 2);
  }

  // 데이터 복원 - JSON에서 상태 복원
  importData(jsonData: string): { success: boolean; message: string } {
    try {
      const parsedData = JSON.parse(jsonData);
      
      // 데이터 구조 검증
      if (!parsedData.data || !Array.isArray(parsedData.data.tests) || !Array.isArray(parsedData.data.attempts)) {
        return { success: false, message: '올바르지 않은 데이터 형식입니다.' };
      }

      // 데이터 복원
      this.state.tests = parsedData.data.tests;
      this.state.attempts = parsedData.data.attempts;
      
      // localStorage에 저장
      this.saveToStorage();
      this.notifyListeners();

      return { success: true, message: '데이터가 성공적으로 복원되었습니다.' };
    } catch (error) {
      console.error('Data import failed:', error);
      return { success: false, message: '데이터 가져오기에 실패했습니다. 파일 형식을 확인해주세요.' };
    }
  }

  // 통계 정보
  getDataStats() {
    return {
      testsCount: this.state.tests.length,
      attemptsCount: this.state.attempts.length,
      questionBankCount: this.state.questionBank.length,
      versionsCount: this.state.tests.reduce((sum, test) => sum + (test.versions?.length || 0), 0),
      sectionsCount: this.state.tests.reduce((sum, test) => 
        sum + (test.versions?.reduce((vSum, version) => 
          vSum + (version.sections?.length || 0), 0) || 0), 0),
      questionsCount: this.state.tests.reduce((sum, test) => 
        sum + (test.versions?.reduce((vSum, version) => 
          vSum + (version.sections?.reduce((sSum, section) => 
            sSum + (section.questions?.length || 0), 0) || 0), 0) || 0), 0),
      assignmentsCount: this.state.tests.reduce((sum, test) => sum + (test.assignments?.length || 0), 0)
    };
  }

  // Question Bank 관리
  addQuestionToBank(question: QuestionBankItem): void {
    this.state.questionBank.push(question);
    this.saveToStorage();
    this.notifyListeners();
  }

  updateQuestionInBank(id: string, updates: Partial<Omit<QuestionBankItem, 'id' | 'createdAt'>>): boolean {
    const index = this.state.questionBank.findIndex(q => q.id === id);
    if (index !== -1) {
      this.state.questionBank[index] = { ...this.state.questionBank[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteQuestionFromBank(id: string): boolean {
    const initialLength = this.state.questionBank.length;
    this.state.questionBank = this.state.questionBank.filter(q => q.id !== id);
    if (this.state.questionBank.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }
}

// 싱글톤 인스턴스
export const localStore = new LocalStore();
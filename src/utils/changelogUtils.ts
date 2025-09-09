import type { ChangelogEntry } from '@/types/changelog';

const CHANGELOG_KEY = 'tn_academy_changelog';

class ChangelogManager {
  private entries: ChangelogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CHANGELOG_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load changelog from storage:', error);
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CHANGELOG_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.warn('Failed to save changelog to storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  logEvent(
    area: ChangelogEntry['area'], 
    action: ChangelogEntry['action'], 
    summary: string, 
    details?: string
  ): void {
    const entry: ChangelogEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      actor: 'admin', // Could be dynamic based on current user
      area,
      action,
      summary,
      details,
    };

    this.entries.unshift(entry); // Add to beginning
    this.saveToStorage();
    this.notifyListeners();
  }

  getEntries(): ChangelogEntry[] {
    return [...this.entries];
  }

  getRecentEntries(limit: number = 10): ChangelogEntry[] {
    return this.entries.slice(0, limit);
  }

  getFilteredEntries(filters: {
    area?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): ChangelogEntry[] {
    let filtered = [...this.entries];

    if (filters.area && filters.area !== 'all') {
      filtered = filtered.filter(entry => entry.area === filters.area);
    }

    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(entry => new Date(entry.at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(entry => new Date(entry.at) <= toDate);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.summary.toLowerCase().includes(searchLower) ||
        (entry.details && entry.details.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  updateEntry(id: string, updates: Partial<Omit<ChangelogEntry, 'id' | 'at'>>): boolean {
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.entries[index] = { ...this.entries[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  deleteEntry(id: string): boolean {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(entry => entry.id !== id);
    if (this.entries.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  exportToJSON(): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      entries: this.entries,
    };
    return JSON.stringify(exportData, null, 2);
  }

  exportToMarkdown(): string {
    const lines = [
      '# TN Academy 변경 기록',
      '',
      `생성일: ${new Date().toLocaleString('ko-KR')}`,
      `총 ${this.entries.length}개 항목`,
      '',
    ];

    // Group by date
    const grouped = this.entries.reduce((acc, entry) => {
      const date = entry.at.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);

    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach(date => {
        lines.push(`## ${date}`);
        lines.push('');
        
        grouped[date].forEach(entry => {
          const time = new Date(entry.at).toLocaleTimeString('ko-KR');
          const areaKo = this.getAreaKorean(entry.area);
          const actionKo = this.getActionKorean(entry.action);
          
          lines.push(`- **${time}** [${areaKo}/${actionKo}] ${entry.summary}`);
          if (entry.details) {
            lines.push(`  ${entry.details}`);
          }
        });
        lines.push('');
      });

    return lines.join('\n');
  }

  private getAreaKorean(area: string): string {
    const mapping: Record<string, string> = {
      tests: '시험',
      versions: '버전',
      sections: '섹션',
      questions: '문항',
      assignments: '배정',
      settings: '설정',
      students: '학생',
      tokens: '토큰',
      backup: '백업',
    };
    return mapping[area] || area;
  }

  private getActionKorean(action: string): string {
    const mapping: Record<string, string> = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      publish: '발행',
      import: '가져오기',
      export: '내보내기',
      deploy: '배포',
      restore: '복원',
    };
    return mapping[action] || action;
  }

  importFromJSON(jsonData: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.entries || !Array.isArray(parsed.entries)) {
        return { success: false, message: '올바르지 않은 JSON 형식입니다.' };
      }

      // Validate entries
      const validEntries = parsed.entries.filter((entry: any) => 
        entry.id && entry.at && entry.area && entry.action && entry.summary
      );

      this.entries = validEntries;
      this.saveToStorage();
      this.notifyListeners();

      return { 
        success: true, 
        message: `${validEntries.length}개의 변경 기록을 가져왔습니다.` 
      };
    } catch (error) {
      return { success: false, message: 'JSON 파싱에 실패했습니다.' };
    }
  }

  clearAll(): void {
    this.entries = [];
    localStorage.removeItem(CHANGELOG_KEY);
    this.notifyListeners();
  }
}

export const changelogManager = new ChangelogManager();

// Utility function for easy logging
export const logEvent = (
  area: ChangelogEntry['area'], 
  action: ChangelogEntry['action'], 
  summary: string, 
  details?: string
): void => {
  changelogManager.logEvent(area, action, summary, details);
};
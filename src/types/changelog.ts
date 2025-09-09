export interface ChangelogEntry {
  id: string;
  at: string; // ISO timestamp
  actor: string; // 'admin', 'teacher', etc.
  area: 'tests' | 'versions' | 'sections' | 'questions' | 'assignments' | 'settings' | 'students' | 'tokens' | 'backup';
  action: 'create' | 'update' | 'delete' | 'publish' | 'import' | 'export' | 'deploy' | 'restore';
  summary: string;
  details?: string;
}

export interface ChangelogStore {
  entries: ChangelogEntry[];
}
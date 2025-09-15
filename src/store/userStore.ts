export interface UserPermissions {
  canEditQuestionBank?: boolean;
  canCreateAccounts?: boolean;
  canManageTests?: boolean;
  canViewAnalytics?: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string; // 개발용 평문 저장
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  system: 'KR' | 'US' | 'UK' | null;
  grade: string | null;
  phone?: string;
  className?: string;
  birthdate?: string; // YYYY-MM-DD 형식
  gender?: 'male' | 'female';
  isActive: boolean;
  permissions: UserPermissions;
  privateNote?: string; // 관리자/교사용 메모 (학생 미노출)
  createdAt: string;
}

export interface AppSettings {
  allowStudentSelfSignup: boolean;
}

class UserStore {
  private readonly USERS_KEY = 'tn_academy_users';
  private readonly SETTINGS_KEY = 'tn_academy_settings';

  constructor() {
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    const users = this.getUsers();
    if (users.length === 0) {
      // 기본 테스트 계정들 생성
      const defaultUsers: User[] = [
        // 관리자 계정
        {
          id: '1',
          username: 'admin',
          password: 'admin123!',
          name: '시스템 관리자',
          role: 'ADMIN',
          system: null,
          grade: null,
          isActive: true,
          permissions: {
            canEditQuestionBank: true,
            canCreateAccounts: true,
            canManageTests: true,
            canViewAnalytics: true
          },
          createdAt: new Date().toISOString()
        },
        // 선생님 계정
        {
          id: '2',
          username: 'teacher',
          password: 'teacher123!',
          name: '테스트 선생님',
          role: 'TEACHER',
          system: 'KR',
          grade: null,
          isActive: true,
          permissions: {
            canEditQuestionBank: false,
            canCreateAccounts: false,
            canManageTests: false,
            canViewAnalytics: true
          },
          createdAt: new Date().toISOString()
        },
        // 학생 계정
        {
          id: '3',
          username: 'student',
          password: 'student123!',
          name: '테스트 학생',
          role: 'STUDENT',
          system: 'KR',
          grade: '중1',
          isActive: true,
          permissions: {
            canEditQuestionBank: false,
            canCreateAccounts: false,
            canManageTests: false,
            canViewAnalytics: false
          },
          createdAt: new Date().toISOString()
        }
      ];
      this.saveUsers(defaultUsers);
    }
  }

  getUsers(): User[] {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    
    // 중복 username 체크
    if (users.some(u => u.username === userData.username)) {
      throw new Error('이미 사용 중인 아이디입니다.');
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // username 변경 시 중복 체크
    if (updates.username && updates.username !== users[index].username) {
      if (users.some(u => u.username === updates.username && u.id !== id)) {
        throw new Error('이미 사용 중인 아이디입니다.');
      }
    }

    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return users[index];
  }

  deleteUser(id: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    this.saveUsers(filteredUsers);
  }

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  authenticate(username: string, password: string): User | null {
    const user = this.getUserByUsername(username);
    
    if (!user || !user.isActive) {
      return null;
    }

    if (user.password === password) {
      return user;
    }

    return null;
  }

  getStudents(): User[] {
    return this.getUsers().filter(u => u.role === 'STUDENT');
  }

  getTeachers(): User[] {
    return this.getUsers().filter(u => u.role === 'TEACHER');
  }

  getAdmins(): User[] {
    return this.getUsers().filter(u => u.role === 'ADMIN');
  }

  // 설정 관리
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : { allowStudentSelfSignup: false };
    } catch {
      return { allowStudentSelfSignup: false };
    }
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
  }

  resetPassword(id: string): string {
    const tempPassword = '1111';
    this.updateUser(id, { password: tempPassword });
    return tempPassword;
  }
}

export const userStore = new UserStore();
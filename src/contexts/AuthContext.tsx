import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { cleanupAuthState } from '@/utils/authCleanup';

interface User {
  id: string;
  username: string;
}

interface Profile {
  id: string;
  user_id: string;
  role: 'student' | 'teacher' | 'admin';
  display_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  signIn: (username: string, password: string) => Promise<Profile | null>;
  signUp: (username: string, password: string, fullName?: string, birthDate?: string, gender?: string, systemType?: string | null, grade?: string | null) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  findUsername: (fullName: string, birthDate: string) => Promise<string | null>;
  resetPassword: (username: string) => Promise<string>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth hook called outside of AuthProvider. Make sure AuthProvider wraps your component tree.');
    console.error('Current context value:', context);
    console.error('AuthContext:', AuthContext);
    
    // Return a default loading state instead of throwing immediately
    return {
      user: null,
      profile: null,
      loading: true,
      requiresPasswordChange: false,
      signIn: async () => { throw new Error('AuthProvider not initialized'); },
      signUp: async () => { throw new Error('AuthProvider not initialized'); },
      checkUsernameAvailable: async () => { throw new Error('AuthProvider not initialized'); },
      findUsername: async () => { throw new Error('AuthProvider not initialized'); },
      resetPassword: async () => { throw new Error('AuthProvider not initialized'); },
      signOut: async () => { throw new Error('AuthProvider not initialized'); },
      refreshUser: async () => { throw new Error('AuthProvider not initialized'); },
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      sessionToken: null,
    } as AuthContextType;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  console.log('AuthProvider rendering with state:', { user, profile, loading });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing...');
        
        // Always use localStorage auth_session_v1 based session
        const authSession = localStorage.getItem('auth_session_v1');
        if (authSession) {
          const sessionData = JSON.parse(authSession);
          const now = Date.now();
          
          // Check if session is expired (7 days)
          if (sessionData.expiresAt && now > sessionData.expiresAt) {
            localStorage.removeItem('auth_session_v1');
            setLoading(false);
            return;
          }
          
          setUser({ id: sessionData.userId, username: sessionData.username });
          setProfile({
            id: sessionData.userId,
            user_id: sessionData.userId,
            role: sessionData.role,
            display_name: sessionData.displayName || sessionData.username,
            email: null,
            created_at: sessionData.createdAt || new Date().toISOString(),
            updated_at: sessionData.updatedAt || new Date().toISOString(),
          });
          setSessionToken(sessionData.sessionToken);
        }
        setLoading(false);
      } catch (error) {
        console.error('AuthProvider: Initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkUsernameAvailable = async (username: string) => {
    const { memoryRepo } = await import('@/repositories/memoryRepo');
    const existingUser = memoryRepo.users.getByUsername(username);
    return !existingUser;
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Clean up any existing auth state first
      cleanupAuthState();
      
      console.log('로그인 시도:', { username });
      
      // Use memoryRepo for authentication
      const { memoryRepo } = await import('@/repositories/memoryRepo');
      const authenticatedUser = memoryRepo.users.authenticate(username, password);
      
      if (!authenticatedUser || !authenticatedUser.isActive) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      }

      // Create session token and save to localStorage auth_session_v1
      const authSessionToken = generateSessionToken();
      const sessionExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      
      const sessionData = {
        userId: authenticatedUser.id,
        username: authenticatedUser.username,
        role: authenticatedUser.role.toLowerCase(),
        displayName: authenticatedUser.name,
        sessionToken: authSessionToken,
        expiresAt: sessionExpiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem('auth_session_v1', JSON.stringify(sessionData));

      const loginUser = { id: authenticatedUser.id, username: authenticatedUser.username };
      const loginProfile: Profile = {
        id: authenticatedUser.id,
        user_id: authenticatedUser.id,
        role: authenticatedUser.role.toLowerCase() as 'student' | 'teacher' | 'admin',
        display_name: authenticatedUser.name,
        email: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(loginUser);
      setProfile(loginProfile);
      setSessionToken(authSessionToken);
      setRequiresPasswordChange(false);

      console.log('로그인 성공 후 프로필:', loginProfile);
      return loginProfile;
    } catch (error: any) {
      throw new Error(error.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  const findUsername = async (fullName: string, birthDate: string) => {
    const { memoryRepo } = await import('@/repositories/memoryRepo');
    const users = memoryRepo.users.getAll();
    const foundUser = users.find(u => u.name === fullName && u.birthdate === birthDate);
    return foundUser ? foundUser.username : null;
  };

  const resetPassword = async (username: string) => {
    const { memoryRepo } = await import('@/repositories/memoryRepo');
    const user = memoryRepo.users.getByUsername(username);

    if (!user) {
      throw new Error('존재하지 않는 아이디입니다.');
    }

    // Generate temporary password and reset
    const tempPassword = memoryRepo.users.resetPassword(user.id);
    return tempPassword;
  };

  const signUp = async (username: string, password: string, fullName?: string, birthDate?: string, gender?: string, systemType?: string | null, grade?: string | null) => {
    try {
      // Check if username is available
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('이미 사용 중인 아이디입니다.');
      }

      const { memoryRepo } = await import('@/repositories/memoryRepo');
      
      // Create new user
      const newUser = memoryRepo.users.create({
        username,
        password,
        name: fullName || username,
        role: 'STUDENT',
        system: systemType as 'KR' | 'US' | 'UK' | null,
        grade: grade,
        phone: '',
        className: '',
        birthdate: birthDate || '',
        gender: gender as 'male' | 'female' | undefined,
        isActive: true,
        permissions: {},
        privateNote: ''
      });

      // Auto login after signup
      await signIn(username, password);
    } catch (error: any) {
      throw new Error(error.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
    } catch (error) {
      console.error('Error during signout:', error);
    }

    setUser(null);
    setProfile(null);
    setSessionToken(null);
    setRequiresPasswordChange(false);
    window.location.href = '/';
  };

  const generateSessionToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  };

  const refreshUser = async () => {
    if (sessionToken) {
      // For memory-based sessions, just reload from localStorage
      const authSession = localStorage.getItem('auth_session_v1');
      if (authSession) {
        const sessionData = JSON.parse(authSession);
        setProfile({
          id: sessionData.userId,
          user_id: sessionData.userId,
          role: sessionData.role,
          display_name: sessionData.displayName || sessionData.username,
          email: null,
          created_at: sessionData.createdAt || new Date().toISOString(),
          updated_at: sessionData.updatedAt || new Date().toISOString(),
        });
      }
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isTeacher = profile?.role === 'teacher' || isAdmin;
  const isStudent = profile?.role === 'student';

  console.log('Auth Context 상태:', { 
    profile: profile?.role, 
    isAdmin, 
    isTeacher, 
    isStudent,
    loading,
    requiresPasswordChange 
  });

  // Ensure stable context value to prevent re-renders
  const value: AuthContextType = React.useMemo(() => ({
    user,
    profile,
    loading,
    requiresPasswordChange,
    signIn,
    signUp,
    checkUsernameAvailable,
    findUsername,
    resetPassword,
    signOut,
    refreshUser,
    isAdmin,
    isTeacher,
    isStudent,
    sessionToken,
  }), [user, profile, loading, requiresPasswordChange, isAdmin, isTeacher, isStudent, sessionToken]);

  console.log('AuthProvider providing value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import { useState, useEffect } from 'react';
import type { ScoringProfile, ShortAnswerProcessingRule, MCQScoringConfig, SpeakingRubricItem } from '@/types';

interface ScoringProfilesHook {
  profiles: ScoringProfile[];
  currentProfile: ScoringProfile | null;
  loading: boolean;
  createProfile: (profile: Omit<ScoringProfile, 'id' | 'createdAt'>) => Promise<ScoringProfile>;
  updateProfile: (id: string, updates: Partial<ScoringProfile>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  setDefaultProfile: (id: string) => Promise<boolean>;
  getDefaultProfile: () => ScoringProfile;
}

const DEFAULT_SCORING_PROFILE: ScoringProfile = {
  id: 'default',
  name: '기본 채점 프로필',
  description: '시스템 기본 채점 프로필',
  isDefault: true,
  createdAt: new Date().toISOString(),
  mcqConfig: {
    defaultPoints: 1,
    wrongPenalty: 0
  },
  shortConfig: {
    ignoreWhitespace: true,
    ignoreCase: false,
    typoTolerance: 0,
    regexPatterns: []
  },
  speakingRubrics: [
    { id: 'fluency', label: '유창성', description: '말의 흐름과 속도', weight: 25, maxScore: 4 },
    { id: 'pronunciation', label: '발음', description: '정확한 발음과 억양', weight: 25, maxScore: 4 },
    { id: 'grammar', label: '문법', description: '문법적 정확성', weight: 25, maxScore: 4 },
    { id: 'content', label: '내용', description: '내용의 적절성과 풍부함', weight: 25, maxScore: 4 }
  ]
};

const PROFILES_STORAGE_KEY = 'tn-scoring-profiles';
const DEFAULT_PROFILE_KEY = 'tn-default-scoring-profile';

export function useScoringProfiles(): ScoringProfilesHook {
  const [profiles, setProfiles] = useState<ScoringProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ScoringProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    try {
      const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
      const defaultProfileId = localStorage.getItem(DEFAULT_PROFILE_KEY);
      
      let allProfiles = stored ? JSON.parse(stored) : [];
      
      // Always ensure default profile exists
      if (!allProfiles.find((p: ScoringProfile) => p.id === 'default')) {
        allProfiles.unshift(DEFAULT_SCORING_PROFILE);
      }
      
      setProfiles(allProfiles);
      
      // Set current profile
      const defaultProfile = allProfiles.find((p: ScoringProfile) => 
        defaultProfileId ? p.id === defaultProfileId : p.isDefault
      ) || allProfiles[0];
      
      setCurrentProfile(defaultProfile);
    } catch (error) {
      console.error('Failed to load scoring profiles:', error);
      setProfiles([DEFAULT_SCORING_PROFILE]);
      setCurrentProfile(DEFAULT_SCORING_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  const saveProfiles = (newProfiles: ScoringProfile[]) => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(newProfiles));
      setProfiles(newProfiles);
    } catch (error) {
      console.error('Failed to save scoring profiles:', error);
      throw error;
    }
  };

  const createProfile = async (profileData: Omit<ScoringProfile, 'id' | 'createdAt'>): Promise<ScoringProfile> => {
    const newProfile: ScoringProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const newProfiles = [...profiles, newProfile];
    saveProfiles(newProfiles);
    
    return newProfile;
  };

  const updateProfile = async (id: string, updates: Partial<ScoringProfile>): Promise<boolean> => {
    const newProfiles = profiles.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    
    saveProfiles(newProfiles);
    
    // Update current profile if it was updated
    if (currentProfile?.id === id) {
      setCurrentProfile(newProfiles.find(p => p.id === id) || null);
    }
    
    return true;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    if (id === 'default') {
      throw new Error('기본 프로필은 삭제할 수 없습니다.');
    }
    
    const newProfiles = profiles.filter(p => p.id !== id);
    saveProfiles(newProfiles);
    
    // If deleted profile was current, switch to default
    if (currentProfile?.id === id) {
      const defaultProfile = newProfiles.find(p => p.isDefault) || newProfiles[0];
      setCurrentProfile(defaultProfile);
      localStorage.setItem(DEFAULT_PROFILE_KEY, defaultProfile.id);
    }
    
    return true;
  };

  const setDefaultProfile = async (id: string): Promise<boolean> => {
    const newProfiles = profiles.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    
    saveProfiles(newProfiles);
    
    const newDefaultProfile = newProfiles.find(p => p.id === id);
    if (newDefaultProfile) {
      setCurrentProfile(newDefaultProfile);
      localStorage.setItem(DEFAULT_PROFILE_KEY, id);
    }
    
    return true;
  };

  const getDefaultProfile = (): ScoringProfile => {
    return profiles.find(p => p.isDefault) || profiles[0] || DEFAULT_SCORING_PROFILE;
  };

  return {
    profiles,
    currentProfile,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    getDefaultProfile
  };
}
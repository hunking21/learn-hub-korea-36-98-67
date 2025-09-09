import { useState, useEffect } from 'react';
import type { PlacementConfig, PlacementCriteria } from '@/types';

interface PlacementConfigHook {
  configs: PlacementConfig[];
  currentConfig: PlacementConfig | null;
  loading: boolean;
  createConfig: (config: Omit<PlacementConfig, 'id' | 'createdAt'>) => Promise<PlacementConfig>;
  updateConfig: (id: string, updates: Partial<PlacementConfig>) => Promise<boolean>;
  deleteConfig: (id: string) => Promise<boolean>;
  setDefaultConfig: (id: string) => Promise<boolean>;
  getDefaultConfig: () => PlacementConfig;
}

const DEFAULT_PLACEMENT_CONFIG: PlacementConfig = {
  id: 'default',
  name: '기본 배치 기준',
  description: '시스템 기본 배치 권고 기준',
  isDefault: true,
  createdAt: new Date().toISOString(),
  criteria: [
    {
      level: 'Starter',
      minTotalScore: 0,
      minSpeakingScore: 0,
      description: '기초 수준 - 영어 학습을 시작하는 단계'
    },
    {
      level: 'Basic',
      minTotalScore: 40,
      minSpeakingScore: 2,
      description: '초급 수준 - 기본적인 의사소통 가능'
    },
    {
      level: 'Intermediate',
      minTotalScore: 70,
      minSpeakingScore: 3,
      description: '중급 수준 - 일상적인 대화 가능'
    },
    {
      level: 'Advanced',
      minTotalScore: 85,
      minSpeakingScore: 3.5,
      description: '고급 수준 - 유창한 의사소통 가능'
    }
  ]
};

const CONFIGS_STORAGE_KEY = 'tn-placement-configs';
const DEFAULT_CONFIG_KEY = 'tn-default-placement-config';

export function usePlacementConfig(): PlacementConfigHook {
  const [configs, setConfigs] = useState<PlacementConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<PlacementConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = () => {
    try {
      const stored = localStorage.getItem(CONFIGS_STORAGE_KEY);
      const defaultConfigId = localStorage.getItem(DEFAULT_CONFIG_KEY);
      
      let allConfigs = stored ? JSON.parse(stored) : [];
      
      // Always ensure default config exists
      if (!allConfigs.find((c: PlacementConfig) => c.id === 'default')) {
        allConfigs.unshift(DEFAULT_PLACEMENT_CONFIG);
      }
      
      setConfigs(allConfigs);
      
      // Set current config
      const defaultConfig = allConfigs.find((c: PlacementConfig) => 
        defaultConfigId ? c.id === defaultConfigId : c.isDefault
      ) || allConfigs[0];
      
      setCurrentConfig(defaultConfig);
    } catch (error) {
      console.error('Failed to load placement configs:', error);
      setConfigs([DEFAULT_PLACEMENT_CONFIG]);
      setCurrentConfig(DEFAULT_PLACEMENT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const saveConfigs = (newConfigs: PlacementConfig[]) => {
    try {
      localStorage.setItem(CONFIGS_STORAGE_KEY, JSON.stringify(newConfigs));
      setConfigs(newConfigs);
    } catch (error) {
      console.error('Failed to save placement configs:', error);
      throw error;
    }
  };

  const createConfig = async (configData: Omit<PlacementConfig, 'id' | 'createdAt'>): Promise<PlacementConfig> => {
    const newConfig: PlacementConfig = {
      ...configData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    const newConfigs = [...configs, newConfig];
    saveConfigs(newConfigs);
    
    return newConfig;
  };

  const updateConfig = async (id: string, updates: Partial<PlacementConfig>): Promise<boolean> => {
    const newConfigs = configs.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    
    saveConfigs(newConfigs);
    
    // Update current config if it was updated
    if (currentConfig?.id === id) {
      setCurrentConfig(newConfigs.find(c => c.id === id) || null);
    }
    
    return true;
  };

  const deleteConfig = async (id: string): Promise<boolean> => {
    if (id === 'default') {
      throw new Error('기본 배치 기준은 삭제할 수 없습니다.');
    }
    
    const newConfigs = configs.filter(c => c.id !== id);
    saveConfigs(newConfigs);
    
    // If deleted config was current, switch to default
    if (currentConfig?.id === id) {
      const defaultConfig = newConfigs.find(c => c.isDefault) || newConfigs[0];
      setCurrentConfig(defaultConfig);
      localStorage.setItem(DEFAULT_CONFIG_KEY, defaultConfig.id);
    }
    
    return true;
  };

  const setDefaultConfig = async (id: string): Promise<boolean> => {
    const newConfigs = configs.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    
    saveConfigs(newConfigs);
    
    const newDefaultConfig = newConfigs.find(c => c.id === id);
    if (newDefaultConfig) {
      setCurrentConfig(newDefaultConfig);
      localStorage.setItem(DEFAULT_CONFIG_KEY, id);
    }
    
    return true;
  };

  const getDefaultConfig = (): PlacementConfig => {
    return configs.find(c => c.isDefault) || configs[0] || DEFAULT_PLACEMENT_CONFIG;
  };

  return {
    configs,
    currentConfig,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    setDefaultConfig,
    getDefaultConfig
  };
}
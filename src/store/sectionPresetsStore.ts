import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SectionType } from '@/types/schema';

export interface SectionPresetConfig {
  label: string;
  type: SectionType;
  timeLimit: number;
  settings?: Record<string, any>;
}

export interface SectionPreset {
  id: string;
  name: string;
  sections: SectionPresetConfig[];
  createdAt: Date;
  updatedAt: Date;
}

interface SectionPresetsState {
  presets: SectionPreset[];
  defaultPresetId: string | null;
  autoApplyDefault: boolean;
  addPreset: (preset: Omit<SectionPreset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePreset: (id: string, updates: Partial<Pick<SectionPreset, 'name' | 'sections'>>) => void;
  deletePreset: (id: string) => void;
  setDefaultPreset: (id: string | null) => void;
  setAutoApplyDefault: (enabled: boolean) => void;
  getDefaultPreset: () => SectionPreset | null;
}

// Default preset data
const DEFAULT_PRESET: Omit<SectionPreset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "진단 기본",
  sections: [
    { label: "Reading", type: "Reading", timeLimit: 50 },
    { label: "Writing", type: "Writing", timeLimit: 15 },
    { label: "Interview", type: "Speaking", timeLimit: 15 },
    { label: "Math", type: "Custom", timeLimit: 50 },
  ],
};

export const useSectionPresetsStore = create<SectionPresetsState>()(
  persist(
    (set, get) => ({
      presets: [],
      defaultPresetId: null,
      autoApplyDefault: true,

      addPreset: (preset) => {
        const id = `preset-${Date.now()}`;
        const now = new Date();
        const newPreset: SectionPreset = {
          ...preset,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
        
        return id;
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
          defaultPresetId: state.defaultPresetId === id ? null : state.defaultPresetId,
        }));
      },

      setDefaultPreset: (id) => {
        set({ defaultPresetId: id });
      },

      setAutoApplyDefault: (enabled) => {
        set({ autoApplyDefault: enabled });
      },

      getDefaultPreset: () => {
        const { presets, defaultPresetId } = get();
        return presets.find((preset) => preset.id === defaultPresetId) || null;
      },
    }),
    {
      name: 'section-presets-store',
      onRehydrateStorage: () => (state) => {
        // Initialize with default preset if none exist
        if (state && state.presets.length === 0) {
          const defaultId = state.addPreset(DEFAULT_PRESET);
          state.setDefaultPreset(defaultId);
        }
      },
    }
  )
);
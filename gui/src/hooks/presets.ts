import { useState, useEffect } from 'react';

export interface TrackerPreset {
  id: string;
  name: string;
  description: string;
  targetCount: number;
  bodyParts: string[];
}

export const DEFAULT_PRESETS: TrackerPreset[] = [
  {
    id: 'minimal',
    name: 'Minimal (Core)',
    description: 'Waist & Hip tracking for basic seated/standing motion',
    targetCount: 3,
    bodyParts: ['waist', 'left_foot', 'right_foot'],
  },
  {
    id: 'five-tracker',
    name: 'Standard (5-Tracker)',
    description: 'Waist, Knees, Feet set for full leg tracking',
    targetCount: 5,
    bodyParts: [
      'waist',
      'left_lower_leg',
      'right_lower_leg',
      'left_foot',
      'right_foot',
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body (Enhanced)',
    description: 'Chest, Waist, Upper/Lower Legs & Feet',
    targetCount: 8,
    bodyParts: [
      'chest',
      'waist',
      'left_upper_leg',
      'right_upper_leg',
      'left_lower_leg',
      'right_lower_leg',
      'left_foot',
      'right_foot',
    ],
  },
  {
    id: 'sitting',
    name: 'Sitting Mode',
    description: 'Optimized orientation for seated desktop & chair usage',
    targetCount: 4,
    bodyParts: ['chest', 'waist', 'left_foot', 'right_foot'],
  },
];

const STORAGE_KEY = 'slimevr_user_presets';
const ACTIVE_PRESET_KEY = 'slimevr_active_preset_id';

export function useTrackerPresets() {
  const [presets, setPresets] = useState<TrackerPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_PRESET_KEY) || 'five-tracker';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch {
      // Ignore localStorage write/quota errors
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, activePresetId);
    } catch {
      // Ignore localStorage write/quota errors
    }
  }, [activePresetId]);

  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

  const createPreset = (name: string, description: string, bodyParts: string[]) => {
    const newPreset: TrackerPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      targetCount: bodyParts.length,
      bodyParts,
    };
    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const duplicatePreset = (presetId: string) => {
    const source = presets.find((p) => p.id === presetId);
    if (!source) return;
    const duplicated: TrackerPreset = {
      ...source,
      id: `copy-${Date.now()}`,
      name: `${source.name} (Copy)`,
    };
    setPresets((prev) => [...prev, duplicated]);
    setActivePresetId(duplicated.id);
  };

  const deletePreset = (presetId: string) => {
    setPresets((prev) => {
      const filtered = prev.filter((p) => p.id !== presetId);
      if (activePresetId === presetId) {
        setActivePresetId(filtered[0]?.id || 'five-tracker');
      }
      return filtered.length > 0 ? filtered : DEFAULT_PRESETS;
    });
  };

  return {
    presets,
    activePreset,
    activePresetId,
    setActivePresetId,
    createPreset,
    duplicatePreset,
    deletePreset,
  };
}

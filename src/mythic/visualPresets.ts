import type { VisualPreset } from '@/stores/useQualityStore';
import type { QualityLevel } from '@/stores/useQualityStore';
import type { MythicVehicleMode } from './types';

export type VisualPresetSpec = {
  id: VisualPreset;
  zhName: string;
  policy: {
    preferLatency: boolean;
    allowPostprocessing: boolean;
    allowChromaticAberration: boolean;
    allowDof: boolean;
    dprCap: number;
  };
};

export const VISUAL_PRESETS: Record<VisualPreset, VisualPresetSpec> = {
  esports: {
    id: 'esports',
    zhName: '赛事',
    policy: {
      preferLatency: true,
      allowPostprocessing: false,
      allowChromaticAberration: false,
      allowDof: false,
      dprCap: 1,
    },
  },
  neon: {
    id: 'neon',
    zhName: '霓虹',
    policy: {
      preferLatency: false,
      allowPostprocessing: true,
      allowChromaticAberration: true,
      allowDof: false,
      dprCap: 2,
    },
  },
  cinematic: {
    id: 'cinematic',
    zhName: '电影',
    policy: {
      preferLatency: false,
      allowPostprocessing: true,
      allowChromaticAberration: true,
      allowDof: true,
      dprCap: 2,
    },
  },
};

export const getVisualPresetSpec = (preset: VisualPreset) => VISUAL_PRESETS[preset];

export const computeEffectiveDpr = (baseDpr: number, preset: VisualPreset) => {
  const cap = VISUAL_PRESETS[preset].policy.dprCap;
  return Math.min(baseDpr, cap);
};

export const shouldEnableComposer = (preset: VisualPreset, bloom: boolean, vehicleMode: MythicVehicleMode) => {
  if (!VISUAL_PRESETS[preset].policy.allowPostprocessing) return false;
  if (preset === 'neon' || preset === 'cinematic') return true;
  if (vehicleMode === 'jet') return true;
  return bloom;
};

export const shouldEnableBloom = (preset: VisualPreset, bloomToggle: boolean) => {
  if (preset === 'esports') return false;
  if (preset === 'neon' || preset === 'cinematic') return true;
  return bloomToggle;
};

export const shouldEnableChromaticAberration = (preset: VisualPreset, vehicleMode: MythicVehicleMode) => {
  if (vehicleMode !== 'jet') return false;
  return VISUAL_PRESETS[preset].policy.allowChromaticAberration;
};

export const shouldEnableDof = (preset: VisualPreset, level: QualityLevel, cameraMode: 'follow' | 'top' | 'driver') => {
  if (!VISUAL_PRESETS[preset].policy.allowDof) return false;
  if (level !== 'ultra') return false;
  return cameraMode !== 'top';
};

export const getBloomParams = (preset: VisualPreset, level: QualityLevel) => {
  if (preset === 'esports') return { threshold: 1.5, intensity: 0, radius: 0.8 };
  if (preset === 'neon') {
    if (level === 'low') return { threshold: 0.55, intensity: 0.55, radius: 0.7 };
    if (level === 'medium') return { threshold: 0.45, intensity: 0.75, radius: 0.75 };
    if (level === 'high') return { threshold: 0.38, intensity: 0.95, radius: 0.85 };
    return { threshold: 0.32, intensity: 1.1, radius: 0.9 };
  }
  if (level === 'low') return { threshold: 0.7, intensity: 0.35, radius: 0.65 };
  if (level === 'medium') return { threshold: 0.6, intensity: 0.45, radius: 0.7 };
  if (level === 'high') return { threshold: 0.52, intensity: 0.55, radius: 0.75 };
  return { threshold: 0.45, intensity: 0.7, radius: 0.82 };
};

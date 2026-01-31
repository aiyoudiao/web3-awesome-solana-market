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
  if (vehicleMode === 'jet') return true;
  return bloom;
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


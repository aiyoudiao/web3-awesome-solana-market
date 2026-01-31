import { describe, it, expect } from 'vitest';
import { shouldEnableChromaticAberration, shouldEnableDof } from './visualPresets';

describe('Visual Presets', () => {
  it('chromatic aberration only in jet and non-esports', () => {
    expect(shouldEnableChromaticAberration('esports', 'jet')).toBe(false);
    expect(shouldEnableChromaticAberration('neon', 'jet')).toBe(true);
    expect(shouldEnableChromaticAberration('cinematic', 'jet')).toBe(true);
    expect(shouldEnableChromaticAberration('neon', 'car')).toBe(false);
  });

  it('DOF only for cinematic + ultra + non-top camera', () => {
    expect(shouldEnableDof('cinematic', 'ultra', 'follow')).toBe(true);
    expect(shouldEnableDof('cinematic', 'ultra', 'top')).toBe(false);
    expect(shouldEnableDof('cinematic', 'high', 'follow')).toBe(false);
    expect(shouldEnableDof('neon', 'ultra', 'follow')).toBe(false);
  });
});


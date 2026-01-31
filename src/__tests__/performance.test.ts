
import { describe, it, expect } from 'vitest';
import { computeEffectiveDpr, shouldEnableComposer } from '@/mythic/visualPresets';

describe('Mythic Vehicle System Performance Policies', () => {
  it('esports preset should clamp DPR to 1', () => {
    expect(computeEffectiveDpr(2, 'esports')).toBe(1);
    expect(computeEffectiveDpr(1.5, 'esports')).toBe(1);
  });

  it('esports preset should disable postprocessing', () => {
    expect(shouldEnableComposer('esports', true, 'car')).toBe(false);
    expect(shouldEnableComposer('esports', true, 'jet')).toBe(false);
  });

  it('neon/cinematic presets should allow composer in jet mode', () => {
    expect(shouldEnableComposer('neon', false, 'jet')).toBe(true);
    expect(shouldEnableComposer('cinematic', false, 'jet')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { TRINITY_MODES } from './trinity';

describe('Trinity Modes Registry', () => {
  it('should expose all three modes', () => {
    expect(Object.keys(TRINITY_MODES).sort()).toEqual(['car', 'jet', 'yacht']);
  });

  it('each mode should include localization and keywords', () => {
    for (const mode of Object.values(TRINITY_MODES)) {
      expect(mode.zhName.length).toBeGreaterThan(1);
      expect(mode.enName.length).toBeGreaterThan(1);
      expect(mode.totem.length).toBeGreaterThan(0);
      expect(mode.keywords.mythic.length).toBeGreaterThan(0);
      expect(mode.keywords.cyber.length).toBeGreaterThan(0);
      expect(mode.keywords.transform.length).toBeGreaterThan(0);
    }
  });
});


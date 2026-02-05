import { describe, it, expect } from 'vitest';
import { EXAMPLES, DEFAULT_EXAMPLE } from '../../src/data/examples.js';

describe('examples manifest', () => {
  describe('EXAMPLES array', () => {
    it('contains example entries with required fields', () => {
      expect(EXAMPLES.length).toBeGreaterThan(0);

      for (const example of EXAMPLES) {
        expect(example).toHaveProperty('id');
        expect(example).toHaveProperty('label');
        expect(example).toHaveProperty('desc');
        expect(typeof example.id).toBe('string');
        expect(typeof example.label).toBe('string');
        expect(typeof example.desc).toBe('string');
      }
    });

    it('includes space-exploration example', () => {
      const spaceExample = EXAMPLES.find(e => e.id === 'space-exploration');
      expect(spaceExample).toBeDefined();
      expect(spaceExample.label).toContain('Space');
    });

    it('includes earth-history example', () => {
      const earthExample = EXAMPLES.find(e => e.id === 'earth-history');
      expect(earthExample).toBeDefined();
    });

    it('includes ancient-civilizations example', () => {
      const ancientExample = EXAMPLES.find(e => e.id === 'ancient-civilizations');
      expect(ancientExample).toBeDefined();
    });

    it('includes wikidata-wars example', () => {
      const warsExample = EXAMPLES.find(e => e.id === 'wikidata-wars');
      expect(warsExample).toBeDefined();
    });

    it('has unique ids', () => {
      const ids = EXAMPLES.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('DEFAULT_EXAMPLE', () => {
    it('is set to space-exploration', () => {
      expect(DEFAULT_EXAMPLE).toBe('space-exploration');
    });

    it('exists in EXAMPLES array', () => {
      const defaultExists = EXAMPLES.some(e => e.id === DEFAULT_EXAMPLE);
      expect(defaultExists).toBe(true);
    });
  });
});

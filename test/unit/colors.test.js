import { describe, it, expect } from 'vitest';
import { lightenColor } from '../../src/rendering/colors.js';

describe('lightenColor', () => {
  describe('with 6-character hex', () => {
    it('lightens red by 20%', () => {
      const result = lightenColor('#ff0000', 0.2);
      expect(result).toBe('#ff3333');
    });

    it('lightens blue by 50%', () => {
      const result = lightenColor('#0000ff', 0.5);
      expect(result).toBe('#8080ff');
    });

    it('lightens dark gray by 30%', () => {
      const result = lightenColor('#333333', 0.3);
      expect(result).toBe('#707070');
    });

    it('handles already white color', () => {
      const result = lightenColor('#ffffff', 0.5);
      expect(result).toBe('#ffffff');
    });

    it('handles black to 50% gray', () => {
      const result = lightenColor('#000000', 0.5);
      expect(result).toBe('#808080');
    });
  });

  describe('with 3-character hex', () => {
    it('expands and lightens #f00', () => {
      const result = lightenColor('#f00', 0.2);
      expect(result).toBe('#ff3333');
    });

    it('expands and lightens #0f0', () => {
      const result = lightenColor('#0f0', 0.5);
      expect(result).toBe('#80ff80');
    });

    it('expands and lightens #abc', () => {
      const result = lightenColor('#abc', 0.2);
      expect(result).toBe('#bbc9d6');
    });
  });

  describe('edge cases', () => {
    it('clamps to white at amount 1.0', () => {
      const result = lightenColor('#ff0000', 1.0);
      expect(result).toBe('#ffffff');
    });

    it('returns original color at amount 0', () => {
      const result = lightenColor('#ff6b6b', 0);
      expect(result).toBe('#ff6b6b');
    });

    it('works without # prefix', () => {
      const result = lightenColor('ff0000', 0.2);
      expect(result).toBe('#ff3333');
    });
  });
});

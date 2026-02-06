import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GestureRecognizer } from '../../src/interaction/gestures.js';

describe('GestureRecognizer', () => {
  describe('pointer tracking', () => {
    it('tracks pointer on add', () => {
      const recognizer = new GestureRecognizer();
      
      recognizer.addPointer(1, 100, 200, 1000);
      
      const pointer = recognizer.getPointer(1);
      expect(pointer).toEqual({
        x: 100,
        y: 200,
        timestamp: 1000,
        initialX: 100,
        initialY: 200,
      });
    });

    it('updates pointer position on move', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 200, 1000);
      
      recognizer.updatePointer(1, 150, 250, 1100);
      
      const pointer = recognizer.getPointer(1);
      expect(pointer).toEqual({
        x: 150,
        y: 250,
        timestamp: 1100,
        initialX: 100,
        initialY: 200,
      });
    });

    it('removes pointer on release', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 200, 1000);
      
      recognizer.removePointer(1);
      
      expect(recognizer.getPointer(1)).toBeUndefined();
    });

    it('returns pointer count', () => {
      const recognizer = new GestureRecognizer();
      expect(recognizer.pointerCount).toBe(0);
      
      recognizer.addPointer(1, 100, 200, 1000);
      expect(recognizer.pointerCount).toBe(1);
      
      recognizer.addPointer(2, 200, 300, 1000);
      expect(recognizer.pointerCount).toBe(2);
    });

    it('ignores pointers beyond limit of 2', () => {
      const recognizer = new GestureRecognizer();
      
      recognizer.addPointer(1, 100, 200, 1000);
      recognizer.addPointer(2, 200, 300, 1000);
      recognizer.addPointer(3, 300, 400, 1000);
      
      expect(recognizer.pointerCount).toBe(2);
      expect(recognizer.getPointer(3)).toBeUndefined();
    });

    it('allows new pointer after one is removed', () => {
      const recognizer = new GestureRecognizer();
      
      recognizer.addPointer(1, 100, 200, 1000);
      recognizer.addPointer(2, 200, 300, 1000);
      recognizer.removePointer(1);
      recognizer.addPointer(3, 300, 400, 1000);
      
      expect(recognizer.pointerCount).toBe(2);
      expect(recognizer.getPointer(3)).toBeDefined();
    });

    it('clears all pointers', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 200, 1000);
      recognizer.addPointer(2, 200, 300, 1000);
      
      recognizer.clear();
      
      expect(recognizer.pointerCount).toBe(0);
    });
  });
});

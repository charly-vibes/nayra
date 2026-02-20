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

  describe('getPinchState', () => {
    it('returns null with fewer than 2 pointers', () => {
      const recognizer = new GestureRecognizer();
      expect(recognizer.getPinchState()).toBeNull();

      recognizer.addPointer(1, 100, 200, 1000);
      expect(recognizer.getPinchState()).toBeNull();
    });

    it('returns distance and midpoint for two pointers', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 0, 1000);
      recognizer.addPointer(2, 200, 0, 1000);

      const pinch = recognizer.getPinchState();
      expect(pinch.distance).toBe(100);
      expect(pinch.midpointX).toBe(150);
      expect(pinch.midpointY).toBe(0);
    });

    it('updates as pointers move', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 0, 1000);
      recognizer.addPointer(2, 200, 0, 1000);

      recognizer.updatePointer(1, 50, 0, 1100);
      recognizer.updatePointer(2, 250, 0, 1100);

      const pinch = recognizer.getPinchState();
      expect(pinch.distance).toBe(200);
      expect(pinch.midpointX).toBe(150);
    });
  });

  describe('pinch-to-zoom gesture', () => {
    it('tracks initial pinch state when second pointer is added', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 0, 0, 1000);
      recognizer.addPointer(2, 100, 0, 1000);

      const zoom = recognizer.getPinchZoom();
      expect(zoom).not.toBeNull();
      expect(zoom.factor).toBe(1.0);
      expect(zoom.midpointX).toBe(50);
      expect(zoom.midpointY).toBe(0);
    });

    it('returns null when fewer than 2 pointers', () => {
      const recognizer = new GestureRecognizer();
      expect(recognizer.getPinchZoom()).toBeNull();

      recognizer.addPointer(1, 100, 200, 1000);
      expect(recognizer.getPinchZoom()).toBeNull();
    });

    it('calculates zoom factor as pointers move apart (zoom in)', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 0, 1000);
      recognizer.addPointer(2, 200, 0, 1000);

      recognizer.updatePointer(1, 50, 0, 1100);
      recognizer.updatePointer(2, 250, 0, 1100);

      const zoom = recognizer.getPinchZoom();
      expect(zoom.factor).toBe(2.0);
      expect(zoom.midpointX).toBe(150);
      expect(zoom.midpointY).toBe(0);
    });

    it('calculates zoom factor as pointers move together (zoom out)', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 0, 0, 1000);
      recognizer.addPointer(2, 200, 0, 1000);

      recognizer.updatePointer(1, 50, 0, 1100);
      recognizer.updatePointer(2, 150, 0, 1100);

      const zoom = recognizer.getPinchZoom();
      expect(zoom.factor).toBe(0.5);
      expect(zoom.midpointX).toBe(100);
      expect(zoom.midpointY).toBe(0);
    });

    it('maintains midpoint accuracy within ±2px during complex movements', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 100, 1000);
      recognizer.addPointer(2, 200, 200, 1000);

      const initialZoom = recognizer.getPinchZoom();
      const initialMidX = initialZoom.midpointX;
      const initialMidY = initialZoom.midpointY;

      recognizer.updatePointer(1, 50, 50, 1100);
      recognizer.updatePointer(2, 250, 250, 1100);

      const zoom = recognizer.getPinchZoom();
      expect(Math.abs(zoom.midpointX - initialMidX)).toBeLessThanOrEqual(2);
      expect(Math.abs(zoom.midpointY - initialMidY)).toBeLessThanOrEqual(2);
    });

    it('handles diagonal pinch gestures correctly', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 0, 0, 1000);
      recognizer.addPointer(2, 100, 100, 1000);

      const initialDistance = Math.sqrt(100 * 100 + 100 * 100);

      recognizer.updatePointer(1, -50, -50, 1100);
      recognizer.updatePointer(2, 150, 150, 1100);

      const zoom = recognizer.getPinchZoom();
      const newDistance = Math.sqrt(200 * 200 + 200 * 200);
      const expectedFactor = newDistance / initialDistance;

      expect(zoom.factor).toBeCloseTo(expectedFactor, 10);
    });

    it('resets pinch tracking when second pointer is removed', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 0, 1000);
      recognizer.addPointer(2, 200, 0, 1000);

      expect(recognizer.getPinchZoom()).not.toBeNull();

      recognizer.removePointer(2);
      expect(recognizer.getPinchZoom()).toBeNull();
    });

    it('resets pinch tracking when adding second pointer again', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 0, 0, 1000);
      recognizer.addPointer(2, 100, 0, 1000);

      recognizer.updatePointer(1, -50, 0, 1100);
      recognizer.updatePointer(2, 150, 0, 1100);

      let zoom = recognizer.getPinchZoom();
      expect(zoom.factor).toBe(2.0);

      recognizer.removePointer(2);
      recognizer.addPointer(3, 50, 0, 1200);

      zoom = recognizer.getPinchZoom();
      expect(zoom.factor).toBe(1.0);
    });

    it('handles zero distance gracefully', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 100, 100, 1000);
      recognizer.addPointer(2, 100, 100, 1000);

      const zoom = recognizer.getPinchZoom();
      expect(zoom).toBeNull();
    });

    it('returns null when initial distance is zero', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 50, 50, 1000);
      recognizer.addPointer(2, 50, 50, 1000);

      const zoom = recognizer.getPinchZoom();
      expect(zoom).toBeNull();
    });
  });

  describe('performance', () => {
    it('handles 10,000 pinch events at 60 FPS', () => {
      const recognizer = new GestureRecognizer();
      recognizer.addPointer(1, 0, 0, 0);
      recognizer.addPointer(2, 100, 0, 0);

      const targetFrameTime = 1000 / 60;
      const eventCount = 10000;

      const start = performance.now();

      for (let i = 0; i < eventCount; i++) {
        const distance = 100 + (i % 200);
        recognizer.updatePointer(1, 0, 0, i);
        recognizer.updatePointer(2, distance, 0, i);
        recognizer.getPinchZoom();
      }

      const end = performance.now();
      const totalTime = end - start;
      const timePerEvent = totalTime / eventCount;
      const fps = 1000 / timePerEvent;

      expect(fps).toBeGreaterThanOrEqual(60);
    });

    it('maintains midpoint accuracy ±2px during 1000 random movements', () => {
      const recognizer = new GestureRecognizer();
      const baseX1 = 100;
      const baseY1 = 100;
      const baseX2 = 200;
      const baseY2 = 200;

      recognizer.addPointer(1, baseX1, baseY1, 0);
      recognizer.addPointer(2, baseX2, baseY2, 0);

      const initialZoom = recognizer.getPinchZoom();
      const expectedMidX = (baseX1 + baseX2) / 2;
      const expectedMidY = (baseY1 + baseY2) / 2;

      for (let i = 0; i < 1000; i++) {
        const scale = 1 + (Math.random() - 0.5) * 0.5;
        const offsetX = (Math.random() - 0.5) * 4;
        const offsetY = (Math.random() - 0.5) * 4;

        const newX1 = expectedMidX + (baseX1 - expectedMidX) * scale + offsetX;
        const newY1 = expectedMidY + (baseY1 - expectedMidY) * scale + offsetY;
        const newX2 = expectedMidX + (baseX2 - expectedMidX) * scale + offsetX;
        const newY2 = expectedMidY + (baseY2 - expectedMidY) * scale + offsetY;

        recognizer.updatePointer(1, newX1, newY1, i);
        recognizer.updatePointer(2, newX2, newY2, i);

        const zoom = recognizer.getPinchZoom();
        expect(Math.abs(zoom.midpointX - expectedMidX)).toBeLessThanOrEqual(2);
        expect(Math.abs(zoom.midpointY - expectedMidY)).toBeLessThanOrEqual(2);
      }
    });
  });
});

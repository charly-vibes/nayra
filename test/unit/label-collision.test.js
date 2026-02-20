import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLabelPriority,
  measureLabel,
  labelsOverlap,
  detectLabelCollisions,
  renderLabel,
} from '../../src/layout/label-collision.js';

describe('Label Collision Detection', () => {
  let mockCtx;

  beforeEach(() => {
    mockCtx = {
      measureText: (text) => ({ width: text.length * 7 }), // Mock: 7px per char
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      rect: () => {},
      clip: () => {},
      fillText: () => {},
      font: '',
      fillStyle: '',
      textBaseline: '',
      textAlign: '',
    };
  });

  describe('calculateLabelPriority', () => {
    it('should prioritize wider events', () => {
      const event = { id: 'e1', start: 0n, end: 100n };
      const priority1 = calculateLabelPriority(event, 50, 1);
      const priority2 = calculateLabelPriority(event, 100, 1);
      expect(priority2).toBeGreaterThan(priority1);
    });

    it('should use explicit priority field', () => {
      const event1 = { id: 'e1', priority: 1 };
      const event2 = { id: 'e2', priority: 5 };
      const priority1 = calculateLabelPriority(event1, 50, 1);
      const priority2 = calculateLabelPriority(event2, 50, 1);
      expect(priority2).toBeGreaterThan(priority1);
    });

    it('should prioritize longer duration events', () => {
      const event1 = { id: 'e1', start: 0n, end: 100n };
      const event2 = { id: 'e2', start: 0n, end: 1000n };
      const priority1 = calculateLabelPriority(event1, 50, 1);
      const priority2 = calculateLabelPriority(event2, 50, 1);
      expect(priority2).toBeGreaterThan(priority1);
    });
  });

  describe('measureLabel', () => {
    it('should measure label dimensions with padding', () => {
      const dims = measureLabel(mockCtx, 'Test');
      expect(dims.width).toBe(4 * 7 + 8); // 4 chars * 7px + 2*4px padding
      expect(dims.height).toBe(14);
    });

    it('should handle empty labels', () => {
      const dims = measureLabel(mockCtx, '');
      expect(dims.width).toBe(8); // Just padding
      expect(dims.height).toBe(14);
    });
  });

  describe('labelsOverlap', () => {
    it('should detect overlapping labels', () => {
      const label1 = { x: 0, y: 0, width: 100, height: 20 };
      const label2 = { x: 50, y: 5, width: 100, height: 20 };
      expect(labelsOverlap(label1, label2)).toBe(true);
    });

    it('should detect non-overlapping labels horizontally', () => {
      const label1 = { x: 0, y: 0, width: 50, height: 20 };
      const label2 = { x: 100, y: 0, width: 50, height: 20 };
      expect(labelsOverlap(label1, label2)).toBe(false);
    });

    it('should detect non-overlapping labels vertically', () => {
      const label1 = { x: 0, y: 0, width: 100, height: 20 };
      const label2 = { x: 0, y: 50, width: 100, height: 20 };
      expect(labelsOverlap(label1, label2)).toBe(false);
    });

    it('should handle edge touching as non-overlapping', () => {
      const label1 = { x: 0, y: 0, width: 50, height: 20 };
      const label2 = { x: 50, y: 0, width: 50, height: 20 };
      expect(labelsOverlap(label1, label2)).toBe(false);
    });
  });

  describe('detectLabelCollisions', () => {
    it('should return empty set for no events', () => {
      const visible = detectLabelCollisions([], mockCtx, 1);
      expect(visible.size).toBe(0);
    });

    it('should show labels for non-overlapping events', () => {
      const events = [
        {
          id: 'e1',
          label: 'Event 1',
          bounds: { x: 0, y: 0, width: 100, height: 20 },
        },
        {
          id: 'e2',
          label: 'Event 2',
          bounds: { x: 200, y: 0, width: 100, height: 20 },
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1);
      expect(visible.has('e1')).toBe(true);
      expect(visible.has('e2')).toBe(true);
    });

    it('should hide low-priority labels when overlapping', () => {
      const events = [
        {
          id: 'e1',
          label: 'Event 1',
          bounds: { x: 0, y: 0, width: 200, height: 20 }, // Wider = higher priority
        },
        {
          id: 'e2',
          label: 'Event 2',
          bounds: { x: 10, y: 0, width: 50, height: 20 }, // Narrower = lower priority
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1);
      expect(visible.has('e1')).toBe(true);
      expect(visible.has('e2')).toBe(false);
    });

    it('should not show labels for events too narrow', () => {
      const events = [
        {
          id: 'e1',
          label: 'Event 1',
          bounds: { x: 0, y: 0, width: 20, height: 20 }, // < 30px
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1);
      expect(visible.has('e1')).toBe(false);
    });

    it('should not show labels for events without labels', () => {
      const events = [
        {
          id: 'e1',
          label: null,
          bounds: { x: 0, y: 0, width: 100, height: 20 },
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1);
      expect(visible.has('e1')).toBe(false);
    });

    it('should use spatial hash buckets for efficiency', () => {
      // Events in different buckets shouldn't affect each other
      const events = [
        {
          id: 'e1',
          label: 'Event 1',
          bounds: { x: 0, y: 0, width: 40, height: 20 },
        },
        {
          id: 'e2',
          label: 'Event 2',
          bounds: { x: 500, y: 0, width: 40, height: 20 }, // Far away
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1, 50);
      expect(visible.has('e1')).toBe(true);
      expect(visible.has('e2')).toBe(true);
    });

    it('should handle dense clusters by hiding some labels', () => {
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          id: `e${i}`,
          label: `Event ${i}`,
          bounds: { x: i * 5, y: 0, width: 100, height: 20 }, // Heavily overlapping
        });
      }
      const visible = detectLabelCollisions(events, mockCtx, 1);
      // Should show some labels, but not all (due to collisions)
      expect(visible.size).toBeGreaterThan(0);
      expect(visible.size).toBeLessThan(10);
    });

    it('should prioritize based on event width', () => {
      const events = [
        {
          id: 'narrow',
          label: 'Narrow',
          bounds: { x: 0, y: 0, width: 50, height: 20 },
        },
        {
          id: 'wide',
          label: 'Wide Event',
          bounds: { x: 10, y: 0, width: 200, height: 20 },
        },
      ];
      const visible = detectLabelCollisions(events, mockCtx, 1);
      expect(visible.has('wide')).toBe(true);
      expect(visible.has('narrow')).toBe(false);
    });
  });

  describe('renderLabel', () => {
    it('should set correct font and style', () => {
      renderLabel(mockCtx, 'Test', 0, 0, 100, 20);
      expect(mockCtx.font).toBe('11px system-ui, sans-serif');
      expect(mockCtx.fillStyle).toBe('#ffffff');
      expect(mockCtx.textBaseline).toBe('middle');
      expect(mockCtx.textAlign).toBe('left');
    });

    it('should call save and restore', () => {
      let saveCalled = false;
      let restoreCalled = false;
      mockCtx.save = () => { saveCalled = true; };
      mockCtx.restore = () => { restoreCalled = true; };

      renderLabel(mockCtx, 'Test', 0, 0, 100, 20);
      expect(saveCalled).toBe(true);
      expect(restoreCalled).toBe(true);
    });
  });
});

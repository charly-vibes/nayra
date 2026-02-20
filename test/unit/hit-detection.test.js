import { describe, it, expect } from 'vitest';
import { findEventAtPoint } from '../../src/interaction/hit-detection.js';
import { RationalScale } from '../../src/core/scale.js';

const EVENT_HEIGHT = 20;

function makeScale(secondsPerPixel = 1) {
  return RationalScale.fromSecondsPerPixel(secondsPerPixel);
}

function makeEvent(id, start, end = undefined) {
  return { id, start: BigInt(start), end: end !== undefined ? BigInt(end) : undefined };
}

describe('findEventAtPoint', () => {
  const canvasHeight = 100;
  const axisY = canvasHeight / 2;
  const eventTop = axisY - EVENT_HEIGHT / 2;
  const eventBottom = axisY + EVENT_HEIGHT / 2;
  const viewportStart = 0n;
  const scale = makeScale(1);

  describe('when no events exist', () => {
    it('returns null', () => {
      const result = findEventAtPoint(50, axisY, [], viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });
  });

  describe('when clicking on an event', () => {
    it('returns that event for a point event', () => {
      const events = [makeEvent('e1', 50)];
      const result = findEventAtPoint(52, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toEqual(events[0]);
    });

    it('returns that event for a span event', () => {
      const events = [makeEvent('e1', 100, 200)];
      const result = findEventAtPoint(150, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toEqual(events[0]);
    });
  });

  describe('when clicking on a gap', () => {
    it('returns null when clicking between events', () => {
      const events = [makeEvent('e1', 10), makeEvent('e2', 100)];
      const result = findEventAtPoint(50, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });

    it('returns null when clicking before all events', () => {
      const events = [makeEvent('e1', 100)];
      const result = findEventAtPoint(5, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });

    it('returns null when clicking after all events', () => {
      const events = [makeEvent('e1', 100)];
      const result = findEventAtPoint(200, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });
  });

  describe('when events overlap', () => {
    it('assigns overlapping events to different lanes', () => {
      const events = [
        makeEvent('lane0', 50, 150),
        makeEvent('lane1', 75, 125),
      ];
      // With multilane layout, overlapping events go to different lanes
      // lane0 event is at axisY, lane1 event is above it
      const resultLane0 = findEventAtPoint(100, axisY, events, viewportStart, scale, canvasHeight);
      expect(resultLane0.id).toBe('lane0'); // Click on lane 0 hits lane0 event

      // Click above lane 0 should hit lane1 event (lane 1 is EVENT_HEIGHT + spacing above)
      const lane1Y = axisY - EVENT_HEIGHT - 4; // lane spacing = 4px
      const resultLane1 = findEventAtPoint(100, lane1Y, events, viewportStart, scale, canvasHeight);
      expect(resultLane1.id).toBe('lane1');
    });

    it('returns the correct event when clicking on non-overlapping region', () => {
      const events = [
        makeEvent('lane0', 50, 150),
        makeEvent('lane1', 75, 125),
      ];
      // Click on the part of lane0 event that doesn't overlap temporally
      const result = findEventAtPoint(52, axisY, events, viewportStart, scale, canvasHeight);
      expect(result.id).toBe('lane0');
    });
  });

  describe('point events (4px width)', () => {
    it('detects hit within 4px width', () => {
      const events = [makeEvent('point', 100)];
      expect(findEventAtPoint(100, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
      expect(findEventAtPoint(102, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
      expect(findEventAtPoint(103, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
    });

    it('misses outside 4px width', () => {
      const events = [makeEvent('point', 100)];
      expect(findEventAtPoint(99, axisY, events, viewportStart, scale, canvasHeight)).toBe(null);
      expect(findEventAtPoint(105, axisY, events, viewportStart, scale, canvasHeight)).toBe(null);
    });
  });

  describe('span events', () => {
    it('detects hit anywhere within span width', () => {
      const events = [makeEvent('span', 100, 200)];
      expect(findEventAtPoint(100, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
      expect(findEventAtPoint(150, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
      expect(findEventAtPoint(199, axisY, events, viewportStart, scale, canvasHeight)).toEqual(events[0]);
    });

    it('misses outside span bounds', () => {
      const events = [makeEvent('span', 100, 200)];
      expect(findEventAtPoint(99, axisY, events, viewportStart, scale, canvasHeight)).toBe(null);
      expect(findEventAtPoint(201, axisY, events, viewportStart, scale, canvasHeight)).toBe(null);
    });
  });

  describe('Y-axis bounds', () => {
    it('returns null when clicking above events', () => {
      const events = [makeEvent('e1', 50, 150)];
      const result = findEventAtPoint(100, eventTop - 5, events, viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });

    it('returns null when clicking below events', () => {
      const events = [makeEvent('e1', 50, 150)];
      const result = findEventAtPoint(100, eventBottom + 5, events, viewportStart, scale, canvasHeight);
      expect(result).toBe(null);
    });

    it('detects hit at exact top edge', () => {
      const events = [makeEvent('e1', 50, 150)];
      const result = findEventAtPoint(100, eventTop, events, viewportStart, scale, canvasHeight);
      expect(result).toEqual(events[0]);
    });

    it('detects hit at center of event', () => {
      const events = [makeEvent('e1', 50, 150)];
      // Single event in lane 0, centered on axisY
      // Should definitely hit at the center
      const result = findEventAtPoint(100, axisY, events, viewportStart, scale, canvasHeight);
      expect(result).toEqual(events[0]);
    });
  });

  describe('with viewport offset', () => {
    it('accounts for viewportStart when projecting events', () => {
      const events = [makeEvent('e1', 1000, 1100)];
      const offsetViewport = 900n;
      const result = findEventAtPoint(150, axisY, events, offsetViewport, scale, canvasHeight);
      expect(result).toEqual(events[0]);
    });
  });

  describe('with different scales', () => {
    it('works with zoomed in scale (0.5 sec/px means event at t=50 is at x=100)', () => {
      const zoomedScale = makeScale(0.5);
      const events = [makeEvent('e1', 50, 100)];
      const result = findEventAtPoint(120, axisY, events, viewportStart, zoomedScale, canvasHeight);
      expect(result).toEqual(events[0]);
    });

    it('works with zoomed out scale (10 sec/px means event at t=500 is at x=50)', () => {
      const zoomedOutScale = makeScale(10);
      const events = [makeEvent('e1', 500, 1000)];
      const result = findEventAtPoint(60, axisY, events, viewportStart, zoomedOutScale, canvasHeight);
      expect(result).toEqual(events[0]);
    });
  });
});

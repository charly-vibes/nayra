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
    it('returns the topmost event (last in array/draw order)', () => {
      const events = [
        makeEvent('bottom', 50, 150),
        makeEvent('top', 75, 125),
      ];
      const result = findEventAtPoint(100, axisY, events, viewportStart, scale, canvasHeight);
      expect(result.id).toBe('top');
    });

    it('returns the correct event when clicking on non-overlapping region', () => {
      const events = [
        makeEvent('bottom', 50, 150),
        makeEvent('top', 75, 125),
      ];
      const result = findEventAtPoint(52, axisY, events, viewportStart, scale, canvasHeight);
      expect(result.id).toBe('bottom');
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

    it('detects hit at exact bottom edge', () => {
      const events = [makeEvent('e1', 50, 150)];
      const result = findEventAtPoint(100, eventBottom, events, viewportStart, scale, canvasHeight);
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

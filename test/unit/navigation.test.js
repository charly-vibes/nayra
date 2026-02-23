import { describe, it, expect } from 'vitest';
import { zoomToEvent } from '../../src/core/navigation.js';
import { RationalScale } from '../../src/core/scale.js';

describe('zoomToEvent', () => {
  const CANVAS_WIDTH = 800;

  it('returns viewportStart and scale', () => {
    const event = { start: 1000n, end: 5000n };
    const result = zoomToEvent(event, CANVAS_WIDTH);
    expect(result).toHaveProperty('viewportStart');
    expect(result).toHaveProperty('scale');
    expect(result.scale).toBeInstanceOf(RationalScale);
  });

  it('centers event in viewport (viewportStart before event.start)', () => {
    const event = { start: 1000n, end: 5000n };
    const result = zoomToEvent(event, CANVAS_WIDTH);
    expect(result.viewportStart).toBeLessThan(event.start);
  });

  it('fits event within view (viewportEnd beyond event.end)', () => {
    const event = { start: 1000n, end: 5000n };
    const result = zoomToEvent(event, CANVAS_WIDTH);
    const viewportEnd = result.viewportStart + result.scale.pxToTime(CANVAS_WIDTH);
    expect(viewportEnd).toBeGreaterThan(event.end);
  });

  it('handles point events (no end) without crashing', () => {
    const event = { start: 1000n };
    expect(() => zoomToEvent(event, CANVAS_WIDTH)).not.toThrow();
    const result = zoomToEvent(event, CANVAS_WIDTH);
    expect(result.viewportStart).toBeDefined();
    expect(result.scale).toBeDefined();
  });

  it('handles point events where end === start', () => {
    const event = { start: 1000n, end: 1000n };
    const result = zoomToEvent(event, CANVAS_WIDTH);
    expect(result.viewportStart).toBeLessThan(event.start);
  });

  it('scale puts event span within the viewport', () => {
    const event = { start: 0n, end: BigInt(86400) }; // 1 day
    const result = zoomToEvent(event, CANVAS_WIDTH);
    const spp = result.scale.getSecondsPerPixel();
    // Total visible range
    const visibleSeconds = spp * CANVAS_WIDTH;
    // Event span in seconds
    const eventSpan = Number(event.end - event.start);
    expect(visibleSeconds).toBeGreaterThan(eventSpan);
  });
});

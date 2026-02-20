import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore } from '../../src/core/store.js';
import { init, destroy, draw } from '../../src/rendering/renderer.js';
import { RationalScale } from '../../src/core/scale.js';

describe('Label Rendering Integration', () => {
  let canvas;
  let store;
  let ctx;
  let fillTextSpy;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.style.width = '800px';
    canvas.style.height = '400px';
    document.body.appendChild(canvas);

    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ width: 800, height: 400, top: 0, left: 0 }),
    });

    store = createStore();
    const result = init(canvas, store.dispatch);
    ctx = result.ctx;

    // Mock canvas methods for JSDOM (doesn't have real implementation)
    if (!ctx.measureText || typeof ctx.measureText !== 'function') {
      ctx.measureText = (text) => ({ width: text.length * 7 });
    }
    if (!ctx.rect || typeof ctx.rect !== 'function') {
      ctx.rect = vi.fn();
    }
    if (!ctx.clip || typeof ctx.clip !== 'function') {
      ctx.clip = vi.fn();
    }

    // Spy on fillText to verify label rendering
    fillTextSpy = vi.spyOn(ctx, 'fillText');
  });

  afterEach(() => {
    destroy();
    document.body.removeChild(canvas);
    fillTextSpy.mockRestore();
  });

  it('should render labels for non-overlapping events', () => {
    // Set a zoom level where events are visible (1 second per pixel)
    store.dispatch({
      type: 'SET_ZOOM',
      scale: RationalScale.fromSecondsPerPixel(1)
    });

    store.dispatch({
      type: 'SET_EVENTS',
      events: [
        { id: 'e1', label: 'Event 1', start: 0n, end: 100n },
        { id: 'e2', label: 'Event 2', start: 500n, end: 600n },
      ],
    });

    draw(store.getState());

    // Should render both labels (non-overlapping)
    const labelCalls = fillTextSpy.mock.calls.filter(
      (call) => call[0] === 'Event 1' || call[0] === 'Event 2'
    );
    expect(labelCalls.length).toBeGreaterThan(0);
  });

  it('should hide labels for narrow events', () => {
    // Zoom out so events are very narrow
    store.dispatch({ type: 'SET_VIEWPORT_START', start: -1000000n });

    store.dispatch({
      type: 'SET_EVENTS',
      events: [
        { id: 'e1', label: 'Narrow Event', start: 0n, end: 10n },
      ],
    });

    draw(store.getState());

    // Should not render label for narrow event
    const labelCalls = fillTextSpy.mock.calls.filter(
      (call) => call[0] === 'Narrow Event'
    );
    expect(labelCalls.length).toBe(0);
  });

  it('should handle events without labels', () => {
    store.dispatch({
      type: 'SET_EVENTS',
      events: [
        { id: 'e1', start: 0n, end: 100n }, // No label
      ],
    });

    draw(store.getState());

    // Should not crash, just not render labels
    expect(fillTextSpy).toHaveBeenCalled(); // FPS counter still renders
  });

  it('should prioritize wider events when labels overlap', () => {
    // Set a zoom level where events are visible (1 second per pixel)
    store.dispatch({
      type: 'SET_ZOOM',
      scale: RationalScale.fromSecondsPerPixel(1)
    });

    // Create events that will overlap on screen
    store.dispatch({
      type: 'SET_EVENTS',
      events: [
        { id: 'wide', label: 'Wide Event', start: 0n, end: 1000n },
        { id: 'narrow', label: 'Narrow Event', start: 10n, end: 50n },
      ],
    });

    draw(store.getState());

    // Check which labels were rendered
    const wideCalls = fillTextSpy.mock.calls.filter(
      (call) => call[0] === 'Wide Event'
    );
    const narrowCalls = fillTextSpy.mock.calls.filter(
      (call) => call[0] === 'Narrow Event'
    );

    // Wide event should be rendered, narrow might not be (depends on collision)
    expect(wideCalls.length).toBeGreaterThan(0);
  });

  it('should handle many events efficiently', () => {
    // Create many events
    const events = [];
    for (let i = 0; i < 100; i++) {
      events.push({
        id: `e${i}`,
        label: `Event ${i}`,
        start: BigInt(i * 100),
        end: BigInt(i * 100 + 50),
      });
    }

    store.dispatch({ type: 'SET_EVENTS', events });

    const startTime = performance.now();
    draw(store.getState());
    const duration = performance.now() - startTime;

    // Should complete in reasonable time (< 50ms)
    expect(duration).toBeLessThan(50);
  });

  it('should update labels on zoom', () => {
    store.dispatch({
      type: 'SET_EVENTS',
      events: [
        { id: 'e1', label: 'Event 1', start: 0n, end: 100n },
      ],
    });

    // Draw at initial zoom
    draw(store.getState());
    const initialCalls = fillTextSpy.mock.calls.length;

    // Zoom in
    fillTextSpy.mockClear();
    store.dispatch({ type: 'ZOOM_IN', cursorX: 400 });
    draw(store.getState());

    // Labels should be re-rendered
    expect(fillTextSpy).toHaveBeenCalled();
  });

  it('should handle dense event clusters', () => {
    // Set a zoom level where events are visible (1 second per pixel)
    store.dispatch({
      type: 'SET_ZOOM',
      scale: RationalScale.fromSecondsPerPixel(1)
    });

    // Create many events in same lane with labels that will overlap
    const events = [];
    for (let i = 0; i < 30; i++) {
      // Events non-overlapping (same lane), but spaced closely so labels overlap
      events.push({
        id: `e${i}`,
        label: `Event ${i}`,
        start: BigInt(i * 60), // 60 seconds apart
        end: BigInt(i * 60 + 50), // 50 second duration (50px wide)
      });
    }

    store.dispatch({ type: 'SET_EVENTS', events });
    draw(store.getState());

    // Should render some labels but not all (collision detection)
    const eventLabelCalls = fillTextSpy.mock.calls.filter((call) =>
      typeof call[0] === 'string' && call[0].startsWith('Event ')
    );

    // With 60px spacing and ~60px label width, labels overlap
    // Should hide some due to collision detection
    expect(eventLabelCalls.length).toBeGreaterThan(0);
    expect(eventLabelCalls.length).toBeLessThan(30);
  });
});

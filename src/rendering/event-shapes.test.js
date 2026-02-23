// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import {
  SHAPE_TYPES,
  SHAPE_LABELS,
  getEventShape,
  drawShape,
  drawEventShapeIndicator,
  getShapeLegend,
  hashString,
} from './event-shapes.js';

describe('hashString', () => {
  it('returns a non-negative integer', () => {
    expect(hashString('astronomy')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashString('astronomy'))).toBe(true);
  });

  it('returns the same value for the same input', () => {
    expect(hashString('science')).toBe(hashString('science'));
  });

  it('returns different values for different inputs (usually)', () => {
    expect(hashString('science')).not.toBe(hashString('history'));
  });
});

describe('getEventShape', () => {
  it('returns "circle" when event has no category', () => {
    expect(getEventShape({})).toBe('circle');
    expect(getEventShape({ category: '' })).toBe('circle');
  });

  it('returns one of SHAPE_TYPES', () => {
    const event = { category: 'astronomy' };
    expect(SHAPE_TYPES).toContain(getEventShape(event));
  });

  it('is deterministic for the same category', () => {
    const event = { category: 'history' };
    expect(getEventShape(event)).toBe(getEventShape(event));
  });

  it('different categories can produce different shapes', () => {
    const shapes = new Set(
      ['astronomy', 'history', 'science', 'politics', 'culture'].map(
        (c) => getEventShape({ category: c })
      )
    );
    // Should get at least 2 distinct shapes across 5 different categories
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('covers all 5 shape types across varied categories', () => {
    const categories = [
      'astronomy', 'history', 'science', 'politics', 'culture',
      'technology', 'biology', 'geology', 'art', 'economics',
    ];
    const usedShapes = new Set(categories.map((c) => getEventShape({ category: c })));
    // With 10 categories we should see most or all shape types
    expect(usedShapes.size).toBeGreaterThanOrEqual(4);
  });
});

describe('drawShape', () => {
  function makeCtx() {
    return {
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
    };
  }

  it('calls fill() for every shape type', () => {
    for (const shape of SHAPE_TYPES) {
      const ctx = makeCtx();
      drawShape(ctx, shape, 50, 50, 5, '#ffffff');
      expect(ctx.fill).toHaveBeenCalled();
    }
  });

  it('sets fillStyle to provided color', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'circle', 50, 50, 5, '#ff0000');
    expect(ctx.fillStyle).toBe('#ff0000');
  });

  it('calls arc for circle', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'circle', 50, 50, 5, '#fff');
    expect(ctx.arc).toHaveBeenCalledWith(50, 50, 5, 0, Math.PI * 2);
  });

  it('calls rect for square', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'square', 50, 50, 5, '#fff');
    expect(ctx.rect).toHaveBeenCalledWith(45, 45, 10, 10);
  });

  it('calls moveTo/lineTo for diamond', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'diamond', 50, 50, 5, '#fff');
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('calls moveTo/lineTo for triangle', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'triangle', 50, 50, 5, '#fff');
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('calls moveTo/lineTo for star (10 vertices)', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'star', 50, 50, 5, '#fff');
    // star has 5*2=10 vertices (1 moveTo + 9 lineTo)
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(9);
  });

  it('falls back to circle for unknown shape', () => {
    const ctx = makeCtx();
    drawShape(ctx, 'unknown', 50, 50, 5, '#fff');
    expect(ctx.arc).toHaveBeenCalled();
  });
});

describe('drawEventShapeIndicator', () => {
  it('calls drawShape (via fill) for event with category', () => {
    const ctx = {
      fillStyle: '',
      globalAlpha: 1,
      beginPath: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
    };
    const event = { id: 'e1', category: 'science' };
    drawEventShapeIndicator(ctx, event, 100, 10, 80, 20);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('does not draw when size would be too small', () => {
    const ctx = {
      fillStyle: '',
      globalAlpha: 1,
      beginPath: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
    };
    // height=2 → size = min(2*0.28, 4) = 0.56 < 1 → no draw
    drawEventShapeIndicator(ctx, { id: 'e1' }, 0, 0, 10, 2);
    expect(ctx.fill).not.toHaveBeenCalled();
  });
});

describe('getShapeLegend', () => {
  it('returns empty array for empty events', () => {
    expect(getShapeLegend([])).toEqual([]);
  });

  it('includes one entry per unique shape used', () => {
    const events = [
      { id: '1', category: 'astronomy' },
      { id: '2', category: 'history' },
      { id: '3', category: 'astronomy' }, // duplicate shape/category
    ];
    const legend = getShapeLegend(events);
    const shapes = legend.map((l) => l.shape);
    // No duplicates
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('each entry has shape, label, and category fields', () => {
    const events = [{ id: '1', category: 'science' }];
    const legend = getShapeLegend(events);
    expect(legend[0]).toHaveProperty('shape');
    expect(legend[0]).toHaveProperty('label');
    expect(legend[0]).toHaveProperty('category');
  });

  it('label corresponds to SHAPE_LABELS', () => {
    const events = [{ id: '1', category: 'astronomy' }];
    const legend = getShapeLegend(events);
    const { shape, label } = legend[0];
    expect(label).toBe(SHAPE_LABELS[shape]);
  });

  it('events without category use "Uncategorized" label in legend', () => {
    const events = [{ id: '1' }];
    const legend = getShapeLegend(events);
    expect(legend[0].category).toBe('Uncategorized');
  });
});

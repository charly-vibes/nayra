import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMatchSpans,
  getEventSearchState,
  getSearchAlpha,
  renderHighlightedLabel,
} from '../../src/rendering/search-highlight.js';

describe('getMatchSpans', () => {
  describe('empty inputs', () => {
    it('returns empty array for empty query', () => {
      expect(getMatchSpans('Hello World', '')).toEqual([]);
    });

    it('returns empty array for null query', () => {
      expect(getMatchSpans('Hello World', null)).toEqual([]);
    });

    it('returns empty array for whitespace-only query', () => {
      expect(getMatchSpans('Hello World', '   ')).toEqual([]);
    });

    it('returns empty array for empty text', () => {
      expect(getMatchSpans('', 'hello')).toEqual([]);
    });

    it('returns empty array for null text', () => {
      expect(getMatchSpans(null, 'hello')).toEqual([]);
    });
  });

  describe('basic matching', () => {
    it('finds a single match at end', () => {
      expect(getMatchSpans('Hello World', 'World')).toEqual([{ start: 6, end: 11 }]);
    });

    it('finds a single match at start', () => {
      expect(getMatchSpans('Hello World', 'Hello')).toEqual([{ start: 0, end: 5 }]);
    });

    it('returns empty array when no match', () => {
      expect(getMatchSpans('Hello World', 'xyz')).toEqual([]);
    });
  });

  describe('multiple matches', () => {
    it('finds multiple non-overlapping matches', () => {
      expect(getMatchSpans('abcabc', 'abc')).toEqual([
        { start: 0, end: 3 },
        { start: 3, end: 6 },
      ]);
    });

    it('finds all occurrences in a longer string', () => {
      const spans = getMatchSpans('the cat sat on the mat', 'at');
      expect(spans).toHaveLength(3);
      expect(spans[0]).toEqual({ start: 5, end: 7 });
      expect(spans[1]).toEqual({ start: 9, end: 11 });
      expect(spans[2]).toEqual({ start: 20, end: 22 });
    });
  });

  describe('case-insensitive search', () => {
    it('matches lowercase query against mixed-case text', () => {
      expect(getMatchSpans('Hello World', 'hello')).toEqual([{ start: 0, end: 5 }]);
    });

    it('matches uppercase query against lowercase text', () => {
      expect(getMatchSpans('hello world', 'HELLO')).toEqual([{ start: 0, end: 5 }]);
    });

    it('matches mixed-case query correctly', () => {
      expect(getMatchSpans('apollo mission', 'Apollo')).toEqual([{ start: 0, end: 6 }]);
    });
  });

  describe('special character escaping', () => {
    it('matches literal dot (not as regex wildcard)', () => {
      const spans = getMatchSpans('test.js file and testXjs file', 'test.js');
      expect(spans).toHaveLength(1);
      expect(spans[0]).toEqual({ start: 0, end: 7 });
    });

    it('matches literal plus character', () => {
      expect(getMatchSpans('1+1=2', '1+1')).toEqual([{ start: 0, end: 3 }]);
    });

    it('matches literal parentheses', () => {
      expect(getMatchSpans('function(args)', 'function(args)')).toEqual([
        { start: 0, end: 14 },
      ]);
    });

    it('matches literal asterisk', () => {
      expect(getMatchSpans('price: $5.00*', '$5.00*')).toEqual([{ start: 7, end: 13 }]);
    });
  });

  describe('performance', () => {
    it('handles 10,000 events worth of text efficiently', () => {
      const longText = 'Apollo mission to the moon '.repeat(100);
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        getMatchSpans(longText, 'Apollo');
      }
      const elapsed = performance.now() - start;
      // Should complete in well under 1 second for 10k calls
      expect(elapsed).toBeLessThan(1000);
    });
  });
});

describe('getEventSearchState', () => {
  it('returns "none" when searchResultIds is null', () => {
    expect(getEventSearchState('e1', null)).toBe('none');
  });

  it('returns "none" when searchResultIds is undefined', () => {
    expect(getEventSearchState('e1', undefined)).toBe('none');
  });

  it('returns "match" for events in the results array', () => {
    expect(getEventSearchState('e1', ['e1', 'e2'])).toBe('match');
    expect(getEventSearchState('e2', ['e1', 'e2'])).toBe('match');
  });

  it('returns "dim" for events not in the results array', () => {
    expect(getEventSearchState('e3', ['e1', 'e2'])).toBe('dim');
  });

  it('returns "dim" when results array is empty', () => {
    expect(getEventSearchState('e1', [])).toBe('dim');
  });

  it('returns "match" for events in a Set', () => {
    expect(getEventSearchState('e1', new Set(['e1', 'e2']))).toBe('match');
  });

  it('returns "dim" for events not in a Set', () => {
    expect(getEventSearchState('e3', new Set(['e1', 'e2']))).toBe('dim');
  });
});

describe('getSearchAlpha', () => {
  it('returns 0.3 for dimmed events', () => {
    expect(getSearchAlpha('dim')).toBe(0.3);
  });

  it('returns 1.0 for matching events', () => {
    expect(getSearchAlpha('match')).toBe(1.0);
  });

  it('returns 1.0 when no active search', () => {
    expect(getSearchAlpha('none')).toBe(1.0);
  });
});

describe('renderHighlightedLabel', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillText: vi.fn(),
      fillRect: vi.fn(),
      measureText: vi.fn((text) => ({ width: text.length * 7 })),
      font: '',
      fillStyle: '',
      textBaseline: '',
      textAlign: '',
    };
  });

  it('calls save and restore', () => {
    renderHighlightedLabel(ctx, 'Hello', 0, 0, 200, 20, '');
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders text without highlights when no query', () => {
    renderHighlightedLabel(ctx, 'Hello World', 10, 5, 200, 20, '');
    expect(ctx.fillText).toHaveBeenCalledWith('Hello World', expect.any(Number), expect.any(Number));
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders a highlight rect for matching text', () => {
    renderHighlightedLabel(ctx, 'Hello World', 10, 5, 200, 20, 'World');
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('renders multiple highlight rects for multiple matches', () => {
    renderHighlightedLabel(ctx, 'abcabc', 0, 0, 200, 20, 'abc');
    // Should call fillRect twice (one per match)
    expect(ctx.fillRect).toHaveBeenCalledTimes(2);
  });

  it('does not throw on null or undefined text', () => {
    expect(() => renderHighlightedLabel(ctx, null, 0, 0, 200, 20, 'query')).not.toThrow();
    expect(() => renderHighlightedLabel(ctx, undefined, 0, 0, 200, 20, 'query')).not.toThrow();
  });
});

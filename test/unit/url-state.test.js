import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  encodeSearchState,
  decodeSearchState,
  buildHashString,
  parseHashString,
} from '../../src/core/url-state.js';

// ---------------------------------------------------------------------------
// Hash encoding / decoding
// ---------------------------------------------------------------------------

describe('encodeSearchState / decodeSearchState', () => {
  it('encodes a search query', () => {
    const hash = encodeSearchState({ searchQuery: 'Apollo', selectedCategories: [], filterMode: 'OR' });
    expect(hash).toContain('q=Apollo');
  });

  it('encodes selected categories', () => {
    const hash = encodeSearchState({ searchQuery: '', selectedCategories: ['Science', 'Military'], filterMode: 'OR' });
    expect(hash).toContain('cats=');
    expect(hash).toContain('Science');
    expect(hash).toContain('Military');
  });

  it('encodes filter mode when it is AND', () => {
    const hash = encodeSearchState({ searchQuery: '', selectedCategories: ['Science'], filterMode: 'AND' });
    expect(hash).toContain('mode=AND');
  });

  it('omits filter mode when it is OR (default)', () => {
    const hash = encodeSearchState({ searchQuery: '', selectedCategories: ['Science'], filterMode: 'OR' });
    expect(hash).not.toContain('mode=');
  });

  it('produces empty string when state is empty', () => {
    const hash = encodeSearchState({ searchQuery: '', selectedCategories: [], filterMode: 'OR' });
    expect(hash).toBe('');
  });

  it('round-trips a full state', () => {
    const original = { searchQuery: 'Moon', selectedCategories: ['Science', 'Space'], filterMode: 'AND' };
    const hash = encodeSearchState(original);
    const restored = decodeSearchState(hash);
    expect(restored.searchQuery).toBe('Moon');
    expect(restored.selectedCategories).toContain('Science');
    expect(restored.selectedCategories).toContain('Space');
    expect(restored.filterMode).toBe('AND');
  });
});

describe('special character encoding', () => {
  it('encodes and decodes queries with spaces', () => {
    const hash = encodeSearchState({ searchQuery: 'Moon Landing', selectedCategories: [], filterMode: 'OR' });
    const restored = decodeSearchState(hash);
    expect(restored.searchQuery).toBe('Moon Landing');
  });

  it('encodes and decodes queries with special URL characters', () => {
    const hash = encodeSearchState({ searchQuery: 'C++/C#', selectedCategories: [], filterMode: 'OR' });
    const restored = decodeSearchState(hash);
    expect(restored.searchQuery).toBe('C++/C#');
  });

  it('encodes and decodes categories with special characters', () => {
    const hash = encodeSearchState({ searchQuery: '', selectedCategories: ['Science & Technology'], filterMode: 'OR' });
    const restored = decodeSearchState(hash);
    expect(restored.selectedCategories).toContain('Science & Technology');
  });
});

// ---------------------------------------------------------------------------
// buildHashString / parseHashString
// ---------------------------------------------------------------------------

describe('buildHashString', () => {
  it('builds a hash string with leading #', () => {
    const hash = buildHashString({ q: 'Moon', mode: 'AND' });
    expect(hash).toMatch(/^#/);
    expect(hash).toContain('q=Moon');
    expect(hash).toContain('mode=AND');
  });

  it('returns empty string for empty params', () => {
    expect(buildHashString({})).toBe('');
  });

  it('excludes null and undefined values', () => {
    const hash = buildHashString({ q: 'Moon', cats: null, mode: undefined });
    expect(hash).not.toContain('cats=');
    expect(hash).not.toContain('mode=');
  });
});

describe('parseHashString', () => {
  it('parses a hash string into key-value pairs', () => {
    const result = parseHashString('#q=Moon&mode=AND');
    expect(result.q).toBe('Moon');
    expect(result.mode).toBe('AND');
  });

  it('handles hash string with leading #', () => {
    const result = parseHashString('#q=test');
    expect(result.q).toBe('test');
  });

  it('handles empty hash string', () => {
    expect(parseHashString('')).toEqual({});
    expect(parseHashString('#')).toEqual({});
  });

  it('handles missing hash gracefully', () => {
    expect(parseHashString(null)).toEqual({});
    expect(parseHashString(undefined)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// State restoration from URL
// ---------------------------------------------------------------------------

describe('decodeSearchState', () => {
  it('returns empty state for empty hash', () => {
    const state = decodeSearchState('');
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategories).toEqual([]);
    expect(state.filterMode).toBe('OR');
  });

  it('defaults filterMode to OR when not specified', () => {
    const state = decodeSearchState('#q=Moon');
    expect(state.filterMode).toBe('OR');
  });

  it('handles malformed hash gracefully', () => {
    expect(() => decodeSearchState('not_a_hash')).not.toThrow();
    expect(() => decodeSearchState('###')).not.toThrow();
    expect(() => decodeSearchState('&&&=')).not.toThrow();
  });

  it('ignores unknown hash parameters', () => {
    const state = decodeSearchState('#q=Moon&unknown=xyz&extra=abc');
    expect(state.searchQuery).toBe('Moon');
    // Should not throw on unknown params
  });

  it('returns empty categories for missing cats param', () => {
    const state = decodeSearchState('#q=Moon');
    expect(state.selectedCategories).toEqual([]);
  });
});

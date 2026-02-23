import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterEvents, createDebouncedSearch } from '../../src/core/search-engine.js';

describe('filterEvents', () => {
  const events = [
    { id: 'e1', title: 'Moon Landing', description: 'Apollo 11 mission to the Moon' },
    { id: 'e2', title: 'World War II', description: 'Major global conflict 1939-1945' },
    { id: 'e3', title: 'Renaissance', description: 'Apollo arts revival in Europe' },
    { id: 'e4', title: 'Apollo Program', description: 'NASA program to land on Moon' },
  ];

  describe('empty query handling', () => {
    it('returns null for empty string', () => {
      expect(filterEvents(events, '')).toBeNull();
    });

    it('returns null for whitespace-only query', () => {
      expect(filterEvents(events, '   ')).toBeNull();
    });

    it('returns null for null query', () => {
      expect(filterEvents(events, null)).toBeNull();
    });

    it('returns null for undefined query', () => {
      expect(filterEvents(events, undefined)).toBeNull();
    });
  });

  describe('basic text matching', () => {
    it('matches events by title', () => {
      const results = filterEvents(events, 'Moon');
      expect(results).toContain('e1');
      expect(results).toContain('e4');
      expect(results).not.toContain('e2');
      expect(results).not.toContain('e3');
    });

    it('matches events by description', () => {
      const results = filterEvents(events, 'global conflict');
      expect(results).toContain('e2');
      expect(results).not.toContain('e1');
    });

    it('returns empty array when no events match', () => {
      const results = filterEvents(events, 'zzznomatch');
      expect(results).toEqual([]);
    });
  });

  describe('multi-field search', () => {
    it('matches events by either title or description', () => {
      const results = filterEvents(events, 'Apollo');
      expect(results).toContain('e1'); // description: "Apollo 11 mission"
      expect(results).toContain('e3'); // description: "Apollo arts revival"
      expect(results).toContain('e4'); // title: "Apollo Program"
      expect(results).not.toContain('e2');
    });

    it('does not duplicate events that match both title and description', () => {
      const dupeEvents = [
        { id: 'e1', title: 'Apollo Mission', description: 'The Apollo program' },
      ];
      const results = filterEvents(dupeEvents, 'Apollo');
      expect(results).toEqual(['e1']);
    });
  });

  describe('case-insensitive search', () => {
    it('matches with lowercase query', () => {
      expect(filterEvents(events, 'moon landing')).toContain('e1');
    });

    it('matches with uppercase query', () => {
      expect(filterEvents(events, 'MOON LANDING')).toContain('e1');
    });

    it('matches with mixed-case query', () => {
      expect(filterEvents(events, 'Moon Landing')).toContain('e1');
    });

    it('matches against uppercase event titles', () => {
      const upperEvents = [{ id: 'e1', title: 'MOON LANDING', description: '' }];
      expect(filterEvents(upperEvents, 'moon landing')).toContain('e1');
    });
  });

  describe('missing fields', () => {
    it('handles events with no description', () => {
      const sparseEvents = [
        { id: 'e1', title: 'Some Event' },
      ];
      expect(filterEvents(sparseEvents, 'Some')).toContain('e1');
    });

    it('handles events with null description', () => {
      const sparseEvents = [
        { id: 'e2', title: 'Other Event', description: null },
      ];
      expect(filterEvents(sparseEvents, 'Other')).toContain('e2');
    });

    it('handles events with undefined title', () => {
      const sparseEvents = [
        { id: 'e1', description: 'A description only event' },
      ];
      expect(filterEvents(sparseEvents, 'description only')).toContain('e1');
    });
  });

  describe('result format', () => {
    it('returns an array of event IDs (not event objects)', () => {
      const results = filterEvents(events, 'Apollo');
      expect(Array.isArray(results)).toBe(true);
      results.forEach((id) => expect(typeof id).toBe('string'));
    });

    it('returns IDs in source order', () => {
      const results = filterEvents(events, 'Apollo');
      const idxE1 = results.indexOf('e1');
      const idxE3 = results.indexOf('e3');
      const idxE4 = results.indexOf('e4');
      expect(idxE1).toBeLessThan(idxE3);
      expect(idxE3).toBeLessThan(idxE4);
    });
  });
});

describe('createDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution by specified delay', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn, 150);

    debounced('query');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('query');
  });

  it('resets the delay when called again before timeout', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn, 150);

    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('uses 150ms as default delay', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn);

    debounced('query');
    vi.advanceTimersByTime(149);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires once after multiple rapid calls', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn, 150);

    debounced('a');
    debounced('ab');
    debounced('abc');
    debounced('abcd');

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('abcd');
  });

  it('can be cancelled before firing', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn, 150);

    debounced('query');
    debounced.cancel();

    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('can fire again after cancellation', () => {
    const fn = vi.fn();
    const debounced = createDebouncedSearch(fn, 150);

    debounced('first');
    debounced.cancel();
    debounced('second');

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('second');
  });
});

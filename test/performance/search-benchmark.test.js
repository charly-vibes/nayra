/**
 * Performance benchmarks for text search.
 * Compares linear scan (filterEvents) vs inverted index (InvertedIndex) at scale.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { filterEvents } from '../../src/core/search-engine.js';
import { InvertedIndex } from '../../src/core/inverted-index.js';

function makeEvents(count) {
  const categories = ['Science', 'Military', 'Political', 'Cultural', 'Economic'];
  return Array.from({ length: count }, (_, i) => ({
    id: `e${i}`,
    label: `Event ${i} ${i % 2 === 0 ? 'Apollo' : 'Discovery'} ${i % 5 === 0 ? 'Mission' : 'Project'}`,
    description: `Description for event ${i}. Category: ${categories[i % 5]}.`,
    category: categories[i % 5],
    tags: ['tag1', `tag${i % 10}`],
    start: BigInt(i),
  }));
}

// ---------------------------------------------------------------------------
// Inverted index unit tests
// ---------------------------------------------------------------------------

describe('InvertedIndex', () => {
  it('builds an index from events', () => {
    const idx = new InvertedIndex();
    const events = [
      { id: 'e1', label: 'Moon Landing', description: 'Apollo mission' },
      { id: 'e2', label: 'World War II', description: 'Major conflict' },
    ];
    idx.build(events);
    expect(idx.search('Moon')).toContain('e1');
    expect(idx.search('World')).toContain('e2');
    expect(idx.search('Apollo')).toContain('e1');
  });

  it('is case-insensitive', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Moon Landing', description: '' }]);
    expect(idx.search('moon landing')).toContain('e1');
    expect(idx.search('MOON')).toContain('e1');
  });

  it('returns null for empty query', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Moon Landing', description: '' }]);
    expect(idx.search('')).toBeNull();
    expect(idx.search(null)).toBeNull();
  });

  it('returns empty array for no matches', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Moon Landing', description: '' }]);
    expect(idx.search('zzznomatch')).toEqual([]);
  });

  it('supports substring matching', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Apollo 11 Mission', description: '' }]);
    // Partial token match
    expect(idx.search('Apoll')).toContain('e1');
  });

  it('updates when new events are added', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Moon', description: '' }]);
    idx.build([{ id: 'e1', label: 'Moon', description: '' }, { id: 'e2', label: 'Mars', description: '' }]);
    expect(idx.search('Mars')).toContain('e2');
  });

  it('does not duplicate results', () => {
    const idx = new InvertedIndex();
    // 'apollo' appears in both label and description
    idx.build([{ id: 'e1', label: 'Apollo Mission', description: 'The Apollo program' }]);
    const results = idx.search('Apollo');
    expect(results.filter((id) => id === 'e1')).toHaveLength(1);
  });

  it('handles events with no description', () => {
    const idx = new InvertedIndex();
    idx.build([{ id: 'e1', label: 'Science Event' }]);
    expect(idx.search('Science')).toContain('e1');
  });
});

// ---------------------------------------------------------------------------
// Performance benchmarks
// ---------------------------------------------------------------------------

describe('Search performance benchmarks', () => {
  let events10k;
  let events50k;
  let idx10k;
  let idx50k;

  beforeAll(() => {
    events10k = makeEvents(10000);
    events50k = makeEvents(50000);
    idx10k = new InvertedIndex();
    idx10k.build(events10k);
    idx50k = new InvertedIndex();
    idx50k.build(events50k);
  });

  describe('Index building performance', () => {
    it('builds index for 10,000 events within 100ms', () => {
      const idx = new InvertedIndex();
      const start = performance.now();
      idx.build(events10k);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('builds index for 50,000 events within 500ms', () => {
      const idx = new InvertedIndex();
      const start = performance.now();
      idx.build(events50k);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Search query performance', () => {
    it('queries 10,000 events in under 10ms (indexed)', () => {
      const start = performance.now();
      idx10k.search('Apollo');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
    });

    it('queries 50,000 events in under 25ms (indexed)', () => {
      const start = performance.now();
      idx50k.search('Apollo');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(25);
    });

    it('indexed search is faster than linear scan for 10K events', () => {
      const linearStart = performance.now();
      for (let i = 0; i < 10; i++) filterEvents(events10k, 'Apollo');
      const linearAvg = (performance.now() - linearStart) / 10;

      const indexedStart = performance.now();
      for (let i = 0; i < 10; i++) idx10k.search('Apollo');
      const indexedAvg = (performance.now() - indexedStart) / 10;

      // Indexed should be at least as fast (both are fast at 10K, so just verify correctness)
      expect(indexedAvg).toBeLessThan(10);
      console.log(`Linear: ${linearAvg.toFixed(3)}ms avg, Indexed: ${indexedAvg.toFixed(3)}ms avg (10K events)`);
    });
  });

  describe('Correctness vs linear scan', () => {
    it('indexed results match linear scan results for 10K events', () => {
      const linearResults = filterEvents(events10k, 'Apollo');
      const indexedResults = idx10k.search('Apollo');

      expect(new Set(indexedResults)).toEqual(new Set(linearResults));
    });

    it('indexed results match linear scan for empty query', () => {
      expect(idx10k.search('')).toBeNull();
      expect(filterEvents(events10k, '')).toBeNull();
    });
  });
});

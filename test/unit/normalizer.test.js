import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/data/normalizer.js';

describe('Normalizer', () => {
  describe('normalize', () => {
    it('converts start-only event to BigInt', () => {
      const events = [{ id: '1', start: '13.8 Ga', label: 'Big Bang' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      expect(typeof result.valid[0].start).toBe('bigint');
      expect(result.valid[0].start).toBeLessThan(0n);
      expect(result.valid[0].id).toBe('1');
      expect(result.valid[0].label).toBe('Big Bang');
      expect(result.errors).toEqual([]);
    });

    it('converts start and end to BigInt', () => {
      const events = [{ id: '1', start: '4.5 Ga', end: '66 Ma', label: 'Span Event' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      expect(typeof result.valid[0].start).toBe('bigint');
      expect(typeof result.valid[0].end).toBe('bigint');
      expect(result.valid[0].start).toBeLessThan(result.valid[0].end);
      expect(result.errors).toEqual([]);
    });

    it('returns error for invalid start', () => {
      const events = [{ id: '1', start: 'invalid date', label: 'Bad Event' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].eventId).toBe('1');
      expect(result.errors[0].field).toBe('start');
      expect(result.errors[0].message).toContain('Could not parse');
    });

    it('keeps event with valid start but invalid end, records error', () => {
      const events = [{ id: '1', start: '2024', end: 'garbage', label: 'Partial' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      expect(typeof result.valid[0].start).toBe('bigint');
      expect(result.valid[0].end).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].eventId).toBe('1');
      expect(result.errors[0].field).toBe('end');
    });

    it('preserves all other event properties', () => {
      const events = [{
        id: 'full',
        start: '1969',
        label: 'Moon Landing',
        description: 'Apollo 11',
        category: 'space',
        tags: ['apollo', 'nasa'],
        priority: 1,
        url: 'https://nasa.gov',
        metadata: { mission: 'Apollo 11' },
      }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      const event = result.valid[0];
      expect(event.label).toBe('Moon Landing');
      expect(event.description).toBe('Apollo 11');
      expect(event.category).toBe('space');
      expect(event.tags).toEqual(['apollo', 'nasa']);
      expect(event.priority).toBe(1);
      expect(event.url).toBe('https://nasa.gov');
      expect(event.metadata).toEqual({ mission: 'Apollo 11' });
    });

    it('handles ISO date format', () => {
      const events = [{ id: '1', start: '2024-03-15', label: 'Event' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      expect(typeof result.valid[0].start).toBe('bigint');
      expect(result.errors).toEqual([]);
    });

    it('handles BCE notation', () => {
      const events = [{ id: '1', start: '44 BCE', label: 'Julius Caesar' }];
      const result = normalize(events);

      expect(result.valid).toHaveLength(1);
      expect(typeof result.valid[0].start).toBe('bigint');
      expect(result.valid[0].start).toBeLessThan(0n);
    });

    it('returns summary with counts', () => {
      const events = [
        { id: '1', start: '2020', label: 'Good' },
        { id: '2', start: 'invalid', label: 'Bad' },
        { id: '3', start: '2022', label: 'Good' },
      ];
      const result = normalize(events);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.summary).toBe('Normalized 2 of 3 events (1 error)');
    });

    it('handles empty array', () => {
      const result = normalize([]);

      expect(result.valid).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.summary).toBe('Normalized 0 of 0 events (0 errors)');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { validate } from '../../src/data/validator.js';

describe('Schema Validator', () => {
  describe('validate', () => {
    describe('valid events', () => {
      it('accepts a minimal valid event', () => {
        const events = [{ id: '1', start: '2024', label: 'Test' }];
        const result = validate(events);

        expect(result.valid).toEqual([{ id: '1', start: '2024', label: 'Test' }]);
        expect(result.errors).toEqual([]);
        expect(result.summary).toBe('Imported 1 of 1 events (0 errors)');
      });

      it('accepts an event with all optional fields', () => {
        const events = [{
          id: 'full-event',
          start: '2024-01-15',
          end: '2024-01-20',
          label: 'Full Event',
          description: 'A complete event',
          category: 'science',
          tags: ['physics', 'discovery'],
          priority: 1,
          precision: 'day',
          url: 'https://example.com',
          source: 'wikidata:Q12345',
          metadata: { custom: 'value' },
        }];

        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('accepts multiple valid events', () => {
        const events = [
          { id: '1', start: '2020', label: 'Event 1' },
          { id: '2', start: '2021', label: 'Event 2' },
          { id: '3', start: '2022', label: 'Event 3' },
        ];

        const result = validate(events);

        expect(result.valid).toHaveLength(3);
        expect(result.errors).toEqual([]);
        expect(result.summary).toBe('Imported 3 of 3 events (0 errors)');
      });
    });

    describe('missing required fields', () => {
      it('rejects event missing id', () => {
        const events = [{ start: '2024', label: 'Test' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('MISSING_REQUIRED');
        expect(result.errors[0].field).toBe('id');
        expect(result.errors[0].event).toBe('index:0');
      });

      it('rejects event missing start', () => {
        const events = [{ id: '1', label: 'Test' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('MISSING_REQUIRED');
        expect(result.errors[0].field).toBe('start');
        expect(result.errors[0].event).toBe('1');
      });

      it('rejects event missing label', () => {
        const events = [{ id: '1', start: '2024' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('MISSING_REQUIRED');
        expect(result.errors[0].field).toBe('label');
        expect(result.errors[0].event).toBe('1');
      });
    });

    describe('empty ID rejection', () => {
      it('rejects empty string id', () => {
        const events = [{ id: '', start: '2024', label: 'Test' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('EMPTY_ID');
        expect(result.errors[0].hint).toContain('meaningful identifier');
      });
    });

    describe('duplicate ID detection', () => {
      it('rejects duplicate ids', () => {
        const events = [
          { id: 'dup', start: '2024', label: 'First' },
          { id: 'dup', start: '2025', label: 'Second' },
        ];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('DUPLICATE_ID');
        expect(result.errors[0].event).toBe('dup');
        expect(result.errors[0].hint).toContain('unique');
      });

      it('lists both occurrences in error', () => {
        const events = [
          { id: 'dup', start: '2024', label: 'First' },
          { id: 'dup', start: '2025', label: 'Second' },
        ];
        const result = validate(events);

        expect(result.errors[0].occurrences).toEqual([0, 1]);
      });
    });

    describe('priority validation', () => {
      it('accepts priority 0-4', () => {
        for (let p = 0; p <= 4; p++) {
          const events = [{ id: `p${p}`, start: '2024', label: 'Test', priority: p }];
          const result = validate(events);
          expect(result.valid).toHaveLength(1);
        }
      });

      it('rejects priority less than 0', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', priority: -1 }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors[0].code).toBe('INVALID_PRIORITY');
        expect(result.errors[0].expected).toBe('number between 0 and 4');
      });

      it('rejects priority greater than 4', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', priority: 5 }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors[0].code).toBe('INVALID_PRIORITY');
      });

      it('rejects non-numeric priority', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', priority: 'high' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors[0].code).toBe('INVALID_PRIORITY');
      });
    });

    describe('precision validation', () => {
      it('accepts valid precision values', () => {
        const validPrecisions = ['day', 'month', 'year', 'decade', 'century'];
        for (const precision of validPrecisions) {
          const events = [{ id: precision, start: '2024', label: 'Test', precision }];
          const result = validate(events);
          expect(result.valid).toHaveLength(1);
        }
      });

      it('rejects invalid precision value', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', precision: 'millisecond' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors[0].code).toBe('INVALID_PRECISION');
        expect(result.errors[0].expected).toContain('day');
        expect(result.errors[0].expected).toContain('month');
        expect(result.errors[0].expected).toContain('year');
        expect(result.errors[0].expected).toContain('decade');
        expect(result.errors[0].expected).toContain('century');
      });
    });

    describe('end before start validation', () => {
      it('rejects event where end is before start', () => {
        const events = [{ id: '1', start: '2024-06-15', end: '2024-06-10', label: 'Invalid' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INVALID_END_BEFORE_START');
        expect(result.errors[0].event).toBe('1');
        expect(result.errors[0].field).toBe('end');
      });

      it('accepts event where end equals start (zero-duration)', () => {
        const events = [{ id: '1', start: '2024-06-15', end: '2024-06-15', label: 'Same Day' }];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('accepts event where end is after start', () => {
        const events = [{ id: '1', start: '2024-06-10', end: '2024-06-15', label: 'Valid Span' }];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('accepts BCE span event (336 BCE to 323 BCE)', () => {
        const events = [{ id: 'alexander', start: '336 BCE', end: '323 BCE', label: 'Reign of Alexander' }];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('accepts negative year span event (-1194 to -1184)', () => {
        const events = [{ id: 'troy', start: '-1194', end: '-1184', label: 'Trojan War' }];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('accepts geological Ma span event (538 Ma to 485 Ma)', () => {
        const events = [{ id: 'cambrian', start: '538 Ma', end: '485 Ma', label: 'Cambrian Period' }];
        const result = validate(events);

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
      });

      it('rejects CE event where end is actually before start', () => {
        const events = [{ id: '1', start: '2024', end: '2020', label: 'Invalid' }];
        const result = validate(events);

        expect(result.valid).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INVALID_END_BEFORE_START');
      });
    });

    describe('partial import with warnings', () => {
      it('imports valid events and skips invalid ones', () => {
        const events = [
          { id: '1', start: '2024', label: 'Valid 1' },
          { id: '', start: '2024', label: 'Invalid - empty id' },
          { id: '2', start: '2025', label: 'Valid 2' },
          { start: '2026', label: 'Invalid - missing id' },
        ];

        const result = validate(events);

        expect(result.valid).toHaveLength(2);
        expect(result.valid[0].id).toBe('1');
        expect(result.valid[1].id).toBe('2');
        expect(result.errors).toHaveLength(2);
        expect(result.summary).toBe('Imported 2 of 4 events (2 errors)');
      });
    });

    describe('error message format', () => {
      it('includes all required error fields', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', priority: 10 }];
        const result = validate(events);

        const error = result.errors[0];
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('event');
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('value');
        expect(error).toHaveProperty('expected');
        expect(error).toHaveProperty('hint');
      });

      it('formats error as readable string', () => {
        const events = [{ id: '1', start: '2024', label: 'Test', priority: 10 }];
        const result = validate(events);

        const formatted = result.errors[0].toString();
        expect(formatted).toContain('Validation Error: INVALID_PRIORITY');
        expect(formatted).toContain('Event: 1');
        expect(formatted).toContain('Field: priority');
        expect(formatted).toContain('Value: 10');
        expect(formatted).toContain('Expected:');
        expect(formatted).toContain('Hint:');
      });
    });
  });
});

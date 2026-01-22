import { describe, it, expect } from 'vitest';
import { transformJsonLd, transformJsonLdWithReport } from '../../src/data/jsonld-transformer.js';

describe('JSON-LD Transformer', () => {
  describe('transformJsonLd', () => {
    it('transforms a single Schema.org Event', () => {
      const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        '@id': 'event-1',
        'name': 'Moon Landing',
        'startDate': '1969-07-20',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'event-1',
        label: 'Moon Landing',
        start: '1969-07-20',
      });
    });

    it('transforms event with optional fields', () => {
      const jsonld = {
        '@type': 'Event',
        '@id': 'event-2',
        'name': 'Fall of Berlin Wall',
        'startDate': '1989-11-09',
        'endDate': '1989-11-10',
        'description': 'The Berlin Wall fell',
        'url': 'https://example.com/berlin-wall',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'event-2',
        label: 'Fall of Berlin Wall',
        start: '1989-11-09',
        end: '1989-11-10',
        description: 'The Berlin Wall fell',
        url: 'https://example.com/berlin-wall',
      });
    });

    it('transforms @graph array of events', () => {
      const jsonld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Event',
            '@id': 'event-1',
            'name': 'Event One',
            'startDate': '2020-01-01',
          },
          {
            '@type': 'Event',
            '@id': 'event-2',
            'name': 'Event Two',
            'startDate': '2021-01-01',
          },
        ],
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-1');
      expect(result[1].id).toBe('event-2');
    });

    it('transforms top-level array of events', () => {
      const jsonld = [
        {
          '@type': 'Event',
          '@id': 'arr-1',
          'name': 'Array Event 1',
          'startDate': '2020-01-01',
        },
        {
          '@type': 'Event',
          '@id': 'arr-2',
          'name': 'Array Event 2',
          'startDate': '2021-01-01',
        },
      ];

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('arr-1');
      expect(result[1].id).toBe('arr-2');
    });

    it('handles schema: prefixed properties', () => {
      const jsonld = {
        '@type': 'schema:Event',
        '@id': 'prefixed-1',
        'schema:name': 'Prefixed Event',
        'schema:startDate': '2022-05-15',
        'schema:description': 'A test event',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'prefixed-1',
        label: 'Prefixed Event',
        start: '2022-05-15',
        description: 'A test event',
      });
    });

    it('handles full URL @type', () => {
      const jsonld = {
        '@type': 'https://schema.org/Event',
        '@id': 'url-type-1',
        'name': 'URL Type Event',
        'startDate': '2023-01-01',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('url-type-1');
    });

    it('extracts @value from JSON-LD value objects', () => {
      const jsonld = {
        '@type': 'Event',
        '@id': 'value-obj-1',
        'name': { '@value': 'Value Object Event' },
        'startDate': { '@value': '2023-06-01' },
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Value Object Event');
      expect(result[0].start).toBe('2023-06-01');
    });

    it('uses schema:identifier as fallback for id', () => {
      const jsonld = {
        '@type': 'Event',
        'identifier': 'identifier-id',
        'name': 'Identifier Event',
        'startDate': '2023-07-01',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('identifier-id');
    });

    it('skips events missing required fields', () => {
      const jsonld = [
        {
          '@type': 'Event',
          '@id': 'valid-1',
          'name': 'Valid Event',
          'startDate': '2020-01-01',
        },
        {
          '@type': 'Event',
          '@id': 'missing-name',
          'startDate': '2020-02-01',
        },
        {
          '@type': 'Event',
          '@id': 'missing-date',
          'name': 'No Date',
        },
        {
          '@type': 'Event',
          'name': 'No ID',
          'startDate': '2020-03-01',
        },
      ];

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid-1');
    });

    it('skips non-Event types in @graph', () => {
      const jsonld = {
        '@graph': [
          {
            '@type': 'Event',
            '@id': 'event-1',
            'name': 'Real Event',
            'startDate': '2020-01-01',
          },
          {
            '@type': 'Person',
            '@id': 'person-1',
            'name': 'John Doe',
          },
          {
            '@type': 'Place',
            '@id': 'place-1',
            'name': 'Some Place',
          },
        ],
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-1');
    });

    it('returns empty array for non-Event single object', () => {
      const jsonld = {
        '@type': 'Person',
        '@id': 'person-1',
        'name': 'John Doe',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(transformJsonLd([])).toEqual([]);
      expect(transformJsonLd({})).toEqual([]);
    });

    it('handles array @type with Event', () => {
      const jsonld = {
        '@type': ['Event', 'SocialEvent'],
        '@id': 'multi-type-1',
        'name': 'Multi-Type Event',
        'startDate': '2024-01-01',
      };

      const result = transformJsonLd(jsonld);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('multi-type-1');
    });
  });

  describe('transformJsonLdWithReport', () => {
    it('returns valid events and empty errors for valid data', () => {
      const jsonld = [{
        '@type': 'Event',
        '@id': 'event-1',
        'name': 'Valid Event',
        'startDate': '2020-01-01',
      }];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.valid).toHaveLength(1);
      expect(result.errors).toEqual([]);
      expect(result.summary).toBe('Transformed 1 of 1 events (0 skipped)');
    });

    it('reports missing id field', () => {
      const jsonld = [{
        '@type': 'Event',
        'name': 'No ID Event',
        'startDate': '2020-01-01',
      }];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('id');
      expect(result.errors[0].code).toBe('MISSING_REQUIRED');
    });

    it('reports missing name field', () => {
      const jsonld = [{
        '@type': 'Event',
        '@id': 'event-1',
        'startDate': '2020-01-01',
      }];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
    });

    it('reports missing startDate field', () => {
      const jsonld = [{
        '@type': 'Event',
        '@id': 'event-1',
        'name': 'No Date Event',
      }];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('startDate');
    });

    it('identifies event by id or index in error', () => {
      const jsonld = [
        {
          '@type': 'Event',
          '@id': 'known-id',
          'startDate': '2020-01-01',
        },
        {
          '@type': 'Event',
          'name': 'No ID',
          'startDate': '2020-01-01',
        },
      ];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.errors[0].event).toBe('known-id');
      expect(result.errors[1].event).toBe('index:1');
    });

    it('includes summary with counts', () => {
      const jsonld = [
        {
          '@type': 'Event',
          '@id': 'valid-1',
          'name': 'Valid',
          'startDate': '2020-01-01',
        },
        {
          '@type': 'Event',
          '@id': 'invalid-1',
          'startDate': '2020-01-01',
        },
        {
          '@type': 'Event',
          '@id': 'valid-2',
          'name': 'Also Valid',
          'startDate': '2021-01-01',
        },
      ];

      const result = transformJsonLdWithReport(jsonld);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.summary).toBe('Transformed 2 of 3 events (1 skipped)');
    });

    it('throws in strict mode on validation errors', () => {
      const jsonld = [{
        '@type': 'Event',
        '@id': 'event-1',
        'startDate': '2020-01-01',
      }];

      expect(() => transformJsonLdWithReport(jsonld, { strict: true }))
        .toThrow('Missing required field: name');
    });
  });
});

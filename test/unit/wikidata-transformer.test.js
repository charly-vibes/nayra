import { describe, it, expect } from 'vitest';
import { transformWikidata } from '../../src/data/wikidata-transformer.js';

describe('Wikidata SPARQL Transformer', () => {
  describe('transformWikidata', () => {
    it('transforms a minimal SPARQL result binding', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q11750' },
            itemLabel: { value: 'Apollo 11' },
            startTime: { value: '1969-07-16T00:00:00Z' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'Q11750',
        label: 'Apollo 11',
        start: '1969-07-16',
        source: 'wikidata:Q11750',
      });
    });

    it('transforms result with start and end times', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q11750' },
            itemLabel: { value: 'Apollo 11' },
            startTime: { value: '1969-07-16T00:00:00Z' },
            endTime: { value: '1969-07-24T00:00:00Z' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result[0].start).toBe('1969-07-16');
      expect(result[0].end).toBe('1969-07-24');
    });

    it('extracts Q-number from Wikidata URI', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q12345' },
            itemLabel: { value: 'Test' },
            startTime: { value: '2020-01-01T00:00:00Z' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result[0].id).toBe('Q12345');
      expect(result[0].source).toBe('wikidata:Q12345');
    });

    it('includes description when present', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q11750' },
            itemLabel: { value: 'Apollo 11' },
            itemDescription: { value: 'First crewed Moon landing mission' },
            startTime: { value: '1969-07-16T00:00:00Z' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result[0].description).toBe('First crewed Moon landing mission');
    });

    it('includes category from instanceOf', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q11750' },
            itemLabel: { value: 'Apollo 11' },
            startTime: { value: '1969-07-16T00:00:00Z' },
            instanceOf: { value: 'crewed spaceflight' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result[0].category).toBe('crewed spaceflight');
    });

    it('includes url from article', () => {
      const sparqlResult = {
        results: {
          bindings: [{
            item: { value: 'http://www.wikidata.org/entity/Q11750' },
            itemLabel: { value: 'Apollo 11' },
            startTime: { value: '1969-07-16T00:00:00Z' },
            article: { value: 'https://en.wikipedia.org/wiki/Apollo_11' },
          }],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result[0].url).toBe('https://en.wikipedia.org/wiki/Apollo_11');
    });

    it('transforms multiple bindings', () => {
      const sparqlResult = {
        results: {
          bindings: [
            {
              item: { value: 'http://www.wikidata.org/entity/Q11750' },
              itemLabel: { value: 'Apollo 11' },
              startTime: { value: '1969-07-16T00:00:00Z' },
            },
            {
              item: { value: 'http://www.wikidata.org/entity/Q43653' },
              itemLabel: { value: 'Apollo 13' },
              startTime: { value: '1970-04-11T00:00:00Z' },
            },
          ],
        },
      };

      const result = transformWikidata(sparqlResult);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('Q11750');
      expect(result[1].id).toBe('Q43653');
    });

    describe('BCE date adjustment', () => {
      it('adjusts astronomical year -43 to 44 BCE', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q1048' },
              itemLabel: { value: 'Assassination of Julius Caesar' },
              startTime: { value: '-0043-03-15T00:00:00Z' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].start).toBe('44 BCE');
      });

      it('adjusts astronomical year 0 to 1 BCE', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q1' },
              itemLabel: { value: 'Year Zero Event' },
              startTime: { value: '0000-01-01T00:00:00Z' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].start).toBe('1 BCE');
      });

      it('adjusts astronomical year -0 to 1 BCE', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q1' },
              itemLabel: { value: 'Year Zero Event' },
              startTime: { value: '-0000-06-15T00:00:00Z' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].start).toBe('1 BCE');
      });

      it('handles deep time BCE dates', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q123' },
              itemLabel: { value: 'Ancient Event' },
              startTime: { value: '-2499-01-01T00:00:00Z' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].start).toBe('2500 BCE');
      });
    });

    describe('precision handling', () => {
      it('simplifies year-precision dates', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q11750' },
              itemLabel: { value: 'Apollo 11' },
              startTime: { value: '1969-01-01T00:00:00Z' },
              startTimePrecision: { value: '9' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].start).toBe('1969');
        expect(result[0].precision).toBe('year');
      });
    });

    describe('edge cases', () => {
      it('returns empty array for empty bindings', () => {
        const sparqlResult = { results: { bindings: [] } };
        expect(transformWikidata(sparqlResult)).toEqual([]);
      });

      it('skips bindings missing required fields', () => {
        const sparqlResult = {
          results: {
            bindings: [
              { item: { value: 'http://www.wikidata.org/entity/Q1' } },
              {
                item: { value: 'http://www.wikidata.org/entity/Q2' },
                itemLabel: { value: 'Valid' },
                startTime: { value: '2020-01-01T00:00:00Z' },
              },
            ],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('Q2');
      });

      it('handles instanceOfLabel variant', () => {
        const sparqlResult = {
          results: {
            bindings: [{
              item: { value: 'http://www.wikidata.org/entity/Q11750' },
              itemLabel: { value: 'Apollo 11' },
              startTime: { value: '1969-07-16T00:00:00Z' },
              instanceOfLabel: { value: 'space mission' },
            }],
          },
        };

        const result = transformWikidata(sparqlResult);

        expect(result[0].category).toBe('space mission');
      });
    });
  });
});

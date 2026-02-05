import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadFromUrl, loadFromFile, loadExample, detectFormat } from '../../src/data/loader.js';

describe('loader', () => {
  describe('detectFormat', () => {
    it('detects Wikidata SPARQL format', () => {
      const data = {
        results: {
          bindings: [
            { item: { value: 'http://www.wikidata.org/entity/Q1' } }
          ]
        }
      };
      expect(detectFormat(data)).toBe('wikidata');
    });

    it('detects JSON-LD with @context', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Test Event'
      };
      expect(detectFormat(data)).toBe('jsonld');
    });

    it('detects JSON-LD with @graph', () => {
      const data = {
        '@graph': [
          { '@type': 'Event', name: 'Test' }
        ]
      };
      expect(detectFormat(data)).toBe('jsonld');
    });

    it('detects plain array format', () => {
      const data = [
        { id: 'event-1', label: 'Event 1', start: '2020-01-01' }
      ];
      expect(detectFormat(data)).toBe('plain');
    });

    it('returns unknown for unrecognized format', () => {
      const data = { random: 'object' };
      expect(detectFormat(data)).toBe('unknown');
    });
  });

  describe('loadFromUrl', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fetches JSON and returns normalized events', async () => {
      const mockData = [
        { id: 'e1', label: 'Event 1', start: '2020-01-01' }
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await loadFromUrl('https://example.com/events.json');

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('e1');
      expect(result.errors).toEqual([]);
      expect(result.summary).toContain('1');
    });

    it('handles fetch errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await loadFromUrl('https://example.com/events.json');

      expect(result.events).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Network error');
    });

    it('handles HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await loadFromUrl('https://example.com/events.json');

      expect(result.events).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('404');
    });

    it('transforms Wikidata format before validation', async () => {
      const mockData = {
        results: {
          bindings: [
            {
              item: { value: 'http://www.wikidata.org/entity/Q1' },
              itemLabel: { value: 'Test Item' },
              startTime: { value: '2020-01-01T00:00:00Z' }
            }
          ]
        }
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await loadFromUrl('https://query.wikidata.org/sparql');

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('Q1');
    });

    it('transforms JSON-LD format before validation', async () => {
      const mockData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Event',
            '@id': 'event-1',
            name: 'Test Event',
            startDate: '2020-01-01'
          }
        ]
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await loadFromUrl('https://example.com/events.jsonld');

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('event-1');
      expect(result.events[0].label).toBe('Test Event');
    });
  });

  describe('loadFromFile', () => {
    it('reads File object and returns normalized events', async () => {
      const mockData = [
        { id: 'e1', label: 'Event 1', start: '2020-01-01' }
      ];
      const file = new File([JSON.stringify(mockData)], 'events.json', { type: 'application/json' });

      const result = await loadFromFile(file);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('e1');
      expect(result.errors).toEqual([]);
    });

    it('handles JSON parse errors', async () => {
      const file = new File(['not valid json'], 'events.json', { type: 'application/json' });

      const result = await loadFromFile(file);

      expect(result.events).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('parse');
    });

    it('handles File read errors', async () => {
      const file = {
        text: () => Promise.reject(new Error('Read error'))
      };

      const result = await loadFromFile(file);

      expect(result.events).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Read error');
    });
  });

  describe('loadExample', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('loads example by name from examples directory', async () => {
      const mockData = [
        { id: 'e1', label: 'Space Event', start: '1957-10-04' }
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await loadExample('space-exploration');

      expect(global.fetch).toHaveBeenCalledWith('examples/space-exploration.json');
      expect(result.events).toHaveLength(1);
    });

    it('handles missing example file', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await loadExample('nonexistent');

      expect(result.events).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('404');
    });
  });
});

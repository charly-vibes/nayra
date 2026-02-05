import { validate } from './validator.js';
import { normalize } from './normalizer.js';
import { transformWikidata } from './wikidata-transformer.js';
import { transformJsonLd } from './jsonld-transformer.js';

export function detectFormat(data) {
  if (data?.results?.bindings && Array.isArray(data.results.bindings)) {
    return 'wikidata';
  }

  if (data?.['@context'] || data?.['@graph']) {
    return 'jsonld';
  }

  if (Array.isArray(data)) {
    return 'plain';
  }

  return 'unknown';
}

function transformToEvents(data, format) {
  switch (format) {
    case 'wikidata':
      return transformWikidata(data);
    case 'jsonld':
      return transformJsonLd(data);
    case 'plain':
      return data;
    default:
      return [];
  }
}

function processPipeline(data) {
  const format = detectFormat(data);
  const rawEvents = transformToEvents(data, format);
  const validated = validate(rawEvents);
  const normalized = normalize(validated.valid);

  const allErrors = [...validated.errors, ...normalized.errors];

  return {
    events: normalized.valid,
    errors: allErrors,
    summary: `Loaded ${normalized.valid.length} events (${allErrors.length} errors)`,
  };
}

export async function loadFromUrl(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        events: [],
        errors: [{ message: `HTTP error: ${response.status} ${response.statusText}` }],
        summary: 'Failed to load events',
      };
    }

    const data = await response.json();
    return processPipeline(data);
  } catch (error) {
    return {
      events: [],
      errors: [{ message: error.message }],
      summary: 'Failed to load events',
    };
  }
}

export async function loadFromFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return processPipeline(data);
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `JSON parse error: ${error.message}`
      : error.message;

    return {
      events: [],
      errors: [{ message }],
      summary: 'Failed to load events',
    };
  }
}

export async function loadExample(name) {
  return loadFromUrl(`examples/${name}.json`);
}

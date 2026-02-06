# Data Loader Implementation Plan

**Date**: 2026-01-23

## Overview

Implement a data loading system that allows users to load timeline events from:
1. Built-in examples (bundled with the app)
2. URL (fetch from remote JSON endpoint)
3. Local file (drag-drop or file picker)

## Related

- Research: N/A
- Spec: N/A (no `specs/` directory exists yet)

## Current State

- **Examples exist**: 4 JSON files in `examples/` (space-exploration, earth-history, ancient-civilizations, wikidata-wars)
- **Validator exists**: `src/data/validator.js` validates events and uses `parseTimeQuery()` for date parsing
- **Transformers exist**: JSON-LD and Wikidata transformers for different input formats
- **Time parser exists**: `src/core/time-parser.js` handles all date formats (ISO, Ga, Ma, years, etc.)
- **No loader**: Main app uses `generateSampleEvents()` which produces hardcoded random BigInt data
- **Gap**: Example JSON files use string dates (`"13.8 Ga"`, `"1969-07-16"`) but store expects BigInt `start`/`end`

## Desired End State

1. **Loader module** (`src/data/loader.js`) that:
   - Fetches JSON from URL
   - Reads File objects (from drag-drop or file picker)
   - Detects format (plain JSON, JSON-LD, Wikidata SPARQL)
   - Transforms and validates events
   - Converts string dates to BigInt timestamps

2. **UI for loading data**:
   - Examples dropdown in help menu or toolbar
   - `?example=space-exploration` URL parameter support
   - Drag-drop overlay for local files
   - File picker button in Examples tab

3. **Default behavior**: Load a bundled example on startup instead of random data

4. **Centralized examples manifest** (`src/data/examples.js`):
   - Single source of truth for available examples
   - Used by URL param logic, help menu, and default selection

**How to verify:**
- Load app with `?example=earth-history` → shows Earth history events
- Load app with no params → shows default example (space-exploration)
- Drag JSON file onto canvas → loads those events
- Use file picker → loads selected file

## Out of Scope

- IndexedDB persistence (future feature)
- Multiple datasets/layers (future feature)
- Remote URL input UI (URL param is enough for now)
- Error toast/notification UI (console.error is fine for now)
- Web Workers for large files (future feature)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Date parsing failures | Normalizer returns structured errors; log to console |
| CORS for remote URLs | Document limitation; user can use local file |
| Large files blocking UI | Impose MAX_EVENTS warning (10,000); future: Web Workers |
| Example bundling | Vite copies `public/` to dist; move examples or use `import.meta.url` |
| Format detection ambiguity | Define deterministic order: Wikidata → JSON-LD → plain array |
| Dropzone MIME type unreliable | Check `.json` extension OR attempt parse regardless |
| Rollback breaks startup | Keep `generateSampleEvents()` as fallback if loader fails |

## Event Schema Contract

Post-normalization, events have this shape:

```typescript
interface NormalizedEvent {
  id: string;           // required
  label: string;        // required
  start: bigint;        // required (seconds since Unix epoch)
  end?: bigint;         // optional
  description?: string;
  category?: string;
  tags?: string[];
  priority?: number;    // 0-4
  precision?: string;   // day, month, year, decade, century, million_years, billion_years
  url?: string;
}
```

---

## Phase 1: Normalizer Module

Create a module that converts JSON event format (string dates) to internal format (BigInt timestamps).

### Changes Required

**File: `src/data/normalizer.js` (new)**
- Purpose: Convert validated event objects from string dates to BigInt timestamps
- Input: Event with `start: "13.8 Ga"`, `end: "66 Ma"` (strings)
- Output: `{ valid: Event[], errors: NormalizationError[], summary: string }`
- Uses: `parseTimeQuery()` from `time-parser.js`
- Tests: `test/data/normalizer.test.js`

### Implementation Approach

```javascript
import { parseTimeQuery } from '../core/time-parser.js';

class NormalizationError {
  constructor({ event, field, value, parseError }) {
    this.code = 'NORMALIZATION_FAILED';
    this.event = event;
    this.field = field;
    this.value = value;
    this.parseError = parseError;
  }
}

export function normalize(events) {
  const valid = [];
  const errors = [];

  for (const event of events) {
    const startResult = parseTimeQuery(String(event.start));
    if (!startResult.success) {
      errors.push(new NormalizationError({
        event: event.id,
        field: 'start',
        value: event.start,
        parseError: startResult.error,
      }));
      continue;
    }

    const normalized = { ...event, start: startResult.time };

    if (event.end !== undefined) {
      const endResult = parseTimeQuery(String(event.end));
      if (endResult.success) {
        normalized.end = endResult.time;
      } else {
        errors.push(new NormalizationError({
          event: event.id,
          field: 'end',
          value: event.end,
          parseError: endResult.error,
        }));
        // Policy: keep event with start only, skip invalid end
      }
    }

    valid.push(normalized);
  }

  const total = events.length;
  const errorCount = errors.length;
  return {
    valid,
    errors,
    summary: `Normalized ${valid.length} of ${total} events (${errorCount} errors)`,
  };
}
```

### Test Cases

```javascript
// test/data/normalizer.test.js
describe('normalize', () => {
  it('converts start-only event to BigInt', () => {
    const result = normalize([{ id: 'e1', label: 'Test', start: '2024-01-15' }]);
    expect(result.valid[0].start).toBe(/* expected BigInt */);
    expect(result.errors).toHaveLength(0);
  });

  it('converts start and end to BigInt', () => {
    const result = normalize([{ id: 'e1', label: 'Test', start: '66 Ma', end: '65 Ma' }]);
    expect(typeof result.valid[0].start).toBe('bigint');
    expect(typeof result.valid[0].end).toBe('bigint');
  });

  it('returns error for invalid start (does not silently drop)', () => {
    const result = normalize([{ id: 'e1', label: 'Test', start: 'garbage' }]);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('start');
  });

  it('keeps event with valid start but invalid end, records error', () => {
    const result = normalize([{ id: 'e1', label: 'Test', start: '2024', end: 'bad' }]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].end).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('end');
  });

  it('preserves all other event properties', () => {
    const result = normalize([{
      id: 'e1', label: 'Test', start: '2024',
      description: 'Desc', category: 'cat', tags: ['a'],
    }]);
    expect(result.valid[0].description).toBe('Desc');
    expect(result.valid[0].category).toBe('cat');
  });
});
```

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`
- [ ] Lint passes: `just lint`

#### Manual:
- [ ] `normalize()` converts example JSON correctly

---

## Phase 2: Loader Module

Create the core loading infrastructure for fetching and processing event data.

### Changes Required

**File: `src/data/loader.js` (new)**
- `loadFromUrl(url)` - Fetch JSON from URL, detect format, transform, validate, normalize
- `loadFromFile(file)` - Read File object, same pipeline
- `loadExample(name)` - Load from `examples/{name}.json`
- Returns: `{ events: [], errors: [], summary: string }`
- Tests: `test/data/loader.test.js`

**File: `src/data/examples.js` (new)**
- Centralized examples manifest

### Implementation Approach

```javascript
// src/data/examples.js
export const EXAMPLES = [
  { id: 'space-exploration', label: 'Space Exploration', desc: '1957-2021' },
  { id: 'earth-history', label: 'Earth History', desc: 'Big Bang to humans' },
  { id: 'ancient-civilizations', label: 'Ancient Civilizations', desc: 'Major ancient empires' },
  { id: 'wikidata-wars', label: 'Wikidata Wars', desc: 'Wars from SPARQL query' },
];

export const DEFAULT_EXAMPLE = 'space-exploration';
```

```javascript
// src/data/loader.js
import { validate } from './validator.js';
import { normalize } from './normalizer.js';
import { transformJsonLdWithReport } from './jsonld-transformer.js';
import { transformWikidata } from './wikidata-transformer.js';

export async function loadFromUrl(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    return { events: [], errors: [{ code: 'FETCH_ERROR', message: e.message }], summary: 'Fetch failed' };
  }

  if (!response.ok) {
    return { events: [], errors: [{ code: 'HTTP_ERROR', status: response.status }], summary: `HTTP ${response.status}` };
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    return { events: [], errors: [{ code: 'JSON_PARSE_ERROR', message: e.message }], summary: 'Invalid JSON' };
  }

  return processData(data);
}

export async function loadFromFile(file) {
  let text;
  try {
    text = await file.text();
  } catch (e) {
    return { events: [], errors: [{ code: 'FILE_READ_ERROR', message: e.message }], summary: 'File read failed' };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { events: [], errors: [{ code: 'JSON_PARSE_ERROR', message: e.message }], summary: 'Invalid JSON' };
  }

  return processData(data);
}

export async function loadExample(name) {
  return loadFromUrl(`examples/${name}.json`);
}

// Format detection order: Wikidata SPARQL → JSON-LD → plain array
function detectFormat(data) {
  if (data.results?.bindings) return 'wikidata';
  if (data['@context'] || data['@graph']) return 'jsonld';
  if (Array.isArray(data)) return 'array';
  return 'unknown';
}

function processData(data) {
  const allErrors = [];
  let events;

  const format = detectFormat(data);

  // 1. Transform based on format
  switch (format) {
    case 'wikidata':
      events = transformWikidata(data);
      break;
    case 'jsonld': {
      const transformed = transformJsonLdWithReport(data);
      events = transformed.valid;
      allErrors.push(...transformed.errors);
      break;
    }
    case 'array':
      events = data;
      break;
    default:
      return { events: [], errors: [{ code: 'UNKNOWN_FORMAT' }], summary: 'Unknown data format' };
  }

  // 2. Validate
  const validated = validate(events);
  allErrors.push(...validated.errors);

  // 3. Normalize
  const normalized = normalize(validated.valid);
  allErrors.push(...normalized.errors);

  const summary = `Loaded ${normalized.valid.length} events (${allErrors.length} errors)`;
  return { events: normalized.valid, errors: allErrors, summary };
}
```

### Test Cases

```javascript
// test/data/loader.test.js
describe('processData', () => {
  it('detects and processes plain array format');
  it('detects and processes JSON-LD format');
  it('detects and processes Wikidata SPARQL format');
  it('returns error for unknown format');
  it('aggregates errors from transform + validate + normalize');
});

describe('loadFromUrl', () => {
  it('returns FETCH_ERROR on network failure');
  it('returns HTTP_ERROR on non-2xx response');
  it('returns JSON_PARSE_ERROR on invalid JSON');
  it('returns normalized events on success');
});
```

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`
- [ ] Lint passes: `just lint`

#### Manual:
- [ ] `loadExample('space-exploration')` returns normalized events with BigInt timestamps

---

## Phase 3: URL Parameter Support

Load example based on `?example=name` URL parameter.

### Changes Required

**File: `src/main.js`**
- Check `URLSearchParams` for `example` param on startup
- If present, call `loadExample(name)` and dispatch events
- If absent, load default example from `EXAMPLES` manifest
- Keep `generateSampleEvents()` as fallback if loader fails

### Implementation Approach

```javascript
import { loadExample } from './data/loader.js';
import { DEFAULT_EXAMPLE } from './data/examples.js';
import { generateSampleEvents } from './data/samples.js';

async function init() {
  const params = new URLSearchParams(window.location.search);
  const exampleName = params.get('example') || DEFAULT_EXAMPLE;

  const result = await loadExample(exampleName);

  if (result.errors.length > 0) {
    console.warn(result.summary, result.errors);
  }

  if (result.events.length > 0) {
    store.dispatch({ type: 'SET_EVENTS', events: result.events });
  } else {
    // Fallback to generated samples if loader fails completely
    console.warn('Loader failed, using generated samples');
    const fallback = generateSampleEvents();
    store.dispatch({ type: 'SET_EVENTS', events: fallback });
  }
}

init();
```

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`

#### Manual:
- [ ] `http://localhost:5173/?example=earth-history` loads Earth history
- [ ] `http://localhost:5173/` loads default example
- [ ] Invalid example name falls back to generated samples

---

## Phase 4: Drag-Drop Support

Allow users to drag JSON files onto the canvas to load them.

### Changes Required

**File: `src/ui/dropzone.js` (new)**
- Create overlay that appears on dragenter
- Handle drop event, read file, call loader
- Accept files by `.json` extension OR attempt parse regardless
- Dispatch events to store
- Tests: `test/ui/dropzone.test.js` (basic unit tests)

**File: `src/main.js`**
- Initialize dropzone with canvas and store

### Implementation Approach

```javascript
import { loadFromFile } from '../data/loader.js';

export function createDropzone(container, onLoad) {
  let overlay = null;

  function showOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'dropzone-overlay';
    overlay.textContent = 'Drop JSON file to load';
    overlay.style.cssText = `
      position: absolute; inset: 0;
      background: rgba(26, 26, 46, 0.9);
      display: flex; align-items: center; justify-content: center;
      color: #00d9ff; font-size: 24px; pointer-events: none;
    `;
    container.appendChild(overlay);
  }

  function hideOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function isJsonFile(file) {
    return file.name.endsWith('.json') || file.type === 'application/json';
  }

  container.addEventListener('dragenter', (e) => {
    e.preventDefault();
    showOverlay();
  });

  container.addEventListener('dragleave', (e) => {
    if (!container.contains(e.relatedTarget)) {
      hideOverlay();
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    hideOverlay();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Accept .json files or try parsing anyway
    if (!isJsonFile(file)) {
      console.warn('File does not appear to be JSON, attempting to parse anyway');
    }

    const result = await loadFromFile(file);
    onLoad(result);
  });

  return { destroy: () => { /* remove listeners */ } };
}
```

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`

#### Manual:
- [ ] Drag `examples/ancient-civilizations.json` onto canvas → loads events
- [ ] Visual overlay appears during drag
- [ ] Non-.json file still attempts parse (with console warning)

---

## Phase 5: Help Menu Examples Tab + File Picker

Add "Examples" tab to help menu with clickable list and file picker button.

### Changes Required

**File: `src/ui/help.js`**
- Add third tab: "Examples"
- Import `EXAMPLES` from `src/data/examples.js`
- List available examples with descriptions
- Click loads that example
- Add "Load from file..." button that opens file picker

**File: `src/main.js`**
- Pass `onLoadExample` callback to help menu

### Implementation Approach

```javascript
import { EXAMPLES } from '../data/examples.js';
import { loadExample, loadFromFile } from '../data/loader.js';

// Add to TABS array
{ id: 'examples', label: 'Examples' }

// Render examples list
const EXAMPLES_CONTENT = `
  <h2>Load Example Dataset</h2>
  <ul class="examples-list">
    ${EXAMPLES.map(ex => `
      <li data-example="${ex.id}">
        <strong>${ex.label}</strong>
        <span>${ex.desc}</span>
      </li>
    `).join('')}
  </ul>
  <button class="file-picker-btn">Load from file...</button>
`;

// In createHelpMenu, accept onLoad callback
export function createHelpMenu(container, { onLoad }) {
  // ... existing code ...

  // Add click handlers for examples
  panel.querySelectorAll('[data-example]').forEach(li => {
    li.addEventListener('click', async () => {
      const result = await loadExample(li.dataset.example);
      onLoad(result);
      hide();
    });
  });

  // File picker
  panel.querySelector('.file-picker-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      if (input.files[0]) {
        const result = await loadFromFile(input.files[0]);
        onLoad(result);
        hide();
      }
    };
    input.click();
  });
}
```

### Success Criteria

#### Automated:
- [ ] Tests pass: `just test`

#### Manual:
- [ ] Press `?` → see Examples tab with all 4 examples listed
- [ ] Click "Earth History" → timeline loads that data
- [ ] Click "Load from file..." → file picker opens
- [ ] Select a JSON file → loads events

---

## Testing Strategy

**Following TDD:**
1. Write tests first for each behavior
2. Watch tests fail (Red)
3. Implement minimal code to pass (Green)
4. Refactor while keeping tests green

**Test types needed:**
- Unit tests: normalizer (all cases above), loader format detection, processData pipeline
- Integration tests: loader → validator → normalizer end-to-end with fixture files
- DOM tests: dropzone, help menu (minimal; keep logic in pure functions)
- E2E tests: (future) Playwright tests for full UI flow

**Test environment:**
- Vitest for unit tests (already configured)
- JSDOM for minimal DOM tests if needed
- Mock fetch for loader URL tests

---

## Rollback Strategy

Phases are semi-independent:
- **Phase 1-2**: Can be reverted without breaking app (samples still work)
- **Phase 3**: Removes samples as default; rollback must restore `generateSampleEvents()` call
- **Phase 4-5**: Pure additions; safe to revert independently

**Fallback behavior**: If loader fails completely, `main.js` falls back to `generateSampleEvents()`.

---

## References

- Existing validator: [src/data/validator.js](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/data/validator.js)
- Time parser: [src/core/time-parser.js](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/core/time-parser.js)
- JSON-LD transformer: [src/data/jsonld-transformer.js](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/src/data/jsonld-transformer.js)
- Example format: [examples/space-exploration.json](file:///var/home/sasha/para/areas/dev/gh/charly/nayra/examples/space-exploration.json)

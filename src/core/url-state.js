/**
 * URL hash serialization/deserialization for search & filter state.
 *
 * Hash format: #q=<encoded-query>&cats=<cat1>,<cat2>&mode=AND
 *
 * - `q`    : URL-encoded search query (omitted when empty)
 * - `cats` : comma-separated, URL-encoded category list (omitted when empty)
 * - `mode` : filter mode, only written when non-default (AND); OR is the default
 */

// ---------------------------------------------------------------------------
// Low-level hash helpers
// ---------------------------------------------------------------------------

/**
 * Build a URL hash string from a params object.
 * Null/undefined values are omitted.
 *
 * @param {Object} params - Key/value pairs
 * @returns {string} Hash string with leading '#', or '' if no params
 */
export function buildHashString(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.length > 0 ? `#${parts.join('&')}` : '';
}

/**
 * Parse a URL hash string into a plain object.
 *
 * @param {string|null|undefined} hash - Hash string (with or without leading #)
 * @returns {Object} Parsed key/value pairs (all strings)
 */
export function parseHashString(hash) {
  if (!hash) return {};
  const bare = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!bare) return {};

  const result = {};
  for (const part of bare.split('&')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx < 1) continue;
    try {
      const key = decodeURIComponent(part.slice(0, eqIdx));
      const val = decodeURIComponent(part.slice(eqIdx + 1));
      result[key] = val;
    } catch {
      // Skip malformed segment
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// High-level state encoding/decoding
// ---------------------------------------------------------------------------

/**
 * Encode search/filter state to a URL hash string.
 *
 * @param {{ searchQuery: string, selectedCategories: string[], filterMode: string }} state
 * @returns {string} Hash string (e.g. '#q=Moon&cats=Science,Military&mode=AND'), or ''
 */
export function encodeSearchState({ searchQuery, selectedCategories, filterMode }) {
  const params = {};

  if (searchQuery) {
    params.q = searchQuery;
  }

  if (selectedCategories && selectedCategories.length > 0) {
    // Encode each category individually, join with comma
    params.cats = selectedCategories.map(encodeURIComponent).join(',');
  }

  if (filterMode && filterMode !== 'OR') {
    params.mode = filterMode;
  }

  return buildHashString(params);
}

/**
 * Encode all app state (search/filter + viewport) to a URL hash string.
 *
 * @param {{ searchQuery: string, selectedCategories: string[], filterMode: string, viewportStart: bigint, spp: number }} state
 * @returns {string} Hash string, or ''
 */
export function encodeAllState({ searchQuery, selectedCategories, filterMode, viewportStart, spp }) {
  const params = {};

  if (searchQuery) {
    params.q = searchQuery;
  }

  if (selectedCategories && selectedCategories.length > 0) {
    params.cats = selectedCategories.map(encodeURIComponent).join(',');
  }

  if (filterMode && filterMode !== 'OR') {
    params.mode = filterMode;
  }

  if (viewportStart != null) {
    params.vs = viewportStart.toString();
  }

  if (spp != null) {
    params.spp = String(spp);
  }

  return buildHashString(params);
}

/**
 * Decode viewport state from a URL hash string.
 * Returns null values if not present or malformed.
 *
 * @param {string|null|undefined} hash
 * @returns {{ viewportStart: bigint|null, spp: number|null }}
 */
export function decodeViewportState(hash) {
  try {
    const params = parseHashString(hash);
    const viewportStart = params.vs != null ? BigInt(params.vs) : null;
    const spp = params.spp != null ? Number(params.spp) : null;
    return { viewportStart, spp };
  } catch {
    return { viewportStart: null, spp: null };
  }
}

/**
 * Decode a URL hash string back to search/filter state.
 * Returns safe defaults if the hash is empty or malformed.
 *
 * @param {string|null|undefined} hash
 * @returns {{ searchQuery: string, selectedCategories: string[], filterMode: string }}
 */
export function decodeSearchState(hash) {
  const defaults = { searchQuery: '', selectedCategories: [], filterMode: 'OR' };

  try {
    const params = parseHashString(hash);

    const searchQuery = params.q || '';

    const selectedCategories = params.cats
      ? params.cats.split(',').map((c) => {
          try { return decodeURIComponent(c); } catch { return c; }
        }).filter(Boolean)
      : [];

    const filterMode = params.mode === 'AND' ? 'AND' : 'OR';

    return { searchQuery, selectedCategories, filterMode };
  } catch {
    return defaults;
  }
}

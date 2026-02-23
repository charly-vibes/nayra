/**
 * Inverted index for fast text search across large event datasets.
 *
 * Build strategy:
 *   - Extract tokens (words) from label + description fields
 *   - Store a posting list (Set of event IDs) per unique token
 *   - Keep tokens in a sorted array for O(log n) prefix lookups
 *
 * Search strategy:
 *   - Tokenize the query
 *   - For each query token, binary-search the sorted token list for prefix matches
 *   - Intersect posting sets across all query tokens
 *
 * Supports prefix matching ('Apoll' matches 'apollo'), case-insensitive.
 * Memory: ~O(unique_tokens) which is well under 100MB for 100K events.
 */

const MIN_TOKEN_LEN = 2;

/**
 * Split text into lowercase alpha-numeric tokens.
 *
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= MIN_TOKEN_LEN);
}

export class InvertedIndex {
  constructor() {
    /** @type {Map<string, Set<string>>} full token → Set of event IDs */
    this._tokenMap = new Map();
    /** @type {string[]} sorted token list for binary search */
    this._sortedTokens = [];
  }

  /**
   * Build (or rebuild) the index from an array of events.
   *
   * @param {Array} events
   */
  build(events) {
    this._tokenMap = new Map();

    for (const event of events) {
      const label = event.title || event.label || '';
      const desc = event.description || '';

      for (const field of [label, desc]) {
        for (const token of tokenize(field)) {
          let set = this._tokenMap.get(token);
          if (!set) {
            set = new Set();
            this._tokenMap.set(token, set);
          }
          set.add(event.id);
        }
      }
    }

    this._sortedTokens = [...this._tokenMap.keys()].sort();
  }

  /**
   * Return event IDs for all index tokens that start with `prefix`.
   * Uses binary search on the sorted token list — O(log n + k) where k = matches.
   *
   * @param {string} prefix
   * @returns {Set<string>}
   */
  _lookupPrefix(prefix) {
    const tokens = this._sortedTokens;
    const n = tokens.length;

    // Binary search: find leftmost index where tokens[i] >= prefix
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (tokens[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }

    const result = new Set();
    for (let i = lo; i < n; i++) {
      if (!tokens[i].startsWith(prefix)) break;
      for (const id of this._tokenMap.get(tokens[i])) result.add(id);
    }
    return result;
  }

  /**
   * Search for events matching a query.
   * Multi-word queries AND the per-token results.
   *
   * @param {string} query
   * @returns {string[]|null} Matching event IDs, or null if query is empty
   */
  search(query) {
    if (!query || query.trim() === '') return null;

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return null;

    let resultSet = null;
    for (const qToken of queryTokens) {
      const matching = this._lookupPrefix(qToken);

      if (matching.size === 0) return [];

      if (resultSet === null) {
        resultSet = matching;
      } else {
        // Intersect: keep only IDs present in both
        for (const id of resultSet) {
          if (!matching.has(id)) resultSet.delete(id);
        }
        if (resultSet.size === 0) return [];
      }
    }

    return resultSet ? [...resultSet] : [];
  }
}

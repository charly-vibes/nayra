/**
 * Feature detection for required browser APIs.
 * Returns a structured capability object for use at startup.
 */

export const REQUIRED_FEATURES = ['canvas', 'bigint', 'indexeddb'];

function detectCanvas() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return { name: 'canvas', required: true, supported: ctx !== null && ctx !== undefined };
  } catch {
    return { name: 'canvas', required: true, supported: false };
  }
}

function detectBigInt() {
  return {
    name: 'bigint',
    required: true,
    supported: typeof BigInt !== 'undefined',
  };
}

function detectIndexedDB() {
  return {
    name: 'indexeddb',
    required: true,
    supported: typeof indexedDB !== 'undefined' && indexedDB !== null,
  };
}

/**
 * Detect required browser features.
 * @returns {{ canvas: FeatureResult, bigint: FeatureResult, indexeddb: FeatureResult }}
 *
 * @typedef {{ name: string, required: boolean, supported: boolean }} FeatureResult
 */
export function detectFeatures() {
  return {
    canvas: detectCanvas(),
    bigint: detectBigInt(),
    indexeddb: detectIndexedDB(),
  };
}

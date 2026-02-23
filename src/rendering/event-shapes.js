/**
 * Event Shapes
 * WCAG 1.4.1 Use of Color (Level A)
 * WCAG 1.4.11 Non-text Contrast (Level AA)
 *
 * Provides shape-based visual encoding so event categories are distinguishable
 * without relying on color alone. Each category maps to a unique shape symbol
 * drawn inside the event rectangle.
 */

export const SHAPE_TYPES = ['circle', 'square', 'diamond', 'triangle', 'star'];

export const SHAPE_LABELS = {
  circle: 'Circle',
  square: 'Square',
  diamond: 'Diamond',
  triangle: 'Triangle',
  star: 'Star',
};

/**
 * Consistent numeric hash for a string (same algorithm as renderer.js hashCode).
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Get shape type for an event based on its category.
 * Events without a category always return 'circle'.
 *
 * @param {Object} event - Event object with optional `category` field
 * @returns {string} One of SHAPE_TYPES
 */
export function getEventShape(event) {
  const key = event.category || '';
  if (!key) return 'circle';
  return SHAPE_TYPES[hashString(key) % SHAPE_TYPES.length];
}

/**
 * Draw a shape symbol centered at (cx, cy).
 * Used as an overlay on event rectangles to convey category independent of color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shape - One of SHAPE_TYPES
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} size - Half-size (radius or half-width)
 * @param {string} color - CSS color string for fill
 */
export function drawShape(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();

  switch (shape) {
    case 'circle':
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      break;

    case 'square':
      ctx.rect(cx - size, cy - size, size * 2, size * 2);
      break;

    case 'diamond':
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size, cy);
      ctx.lineTo(cx, cy + size);
      ctx.lineTo(cx - size, cy);
      ctx.closePath();
      break;

    case 'triangle': {
      const h = size * 1.5;
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx + size, cy + h / 2);
      ctx.lineTo(cx - size, cy + h / 2);
      ctx.closePath();
      break;
    }

    case 'star': {
      const outerR = size;
      const innerR = size * 0.45;
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    default:
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
  }

  ctx.fill();
}

/**
 * Draw the category shape indicator inside an event rectangle.
 * The shape is drawn as a small white symbol to be visible on any category color.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} event - Event object
 * @param {number} x - Event rectangle left edge
 * @param {number} y - Event rectangle top edge
 * @param {number} width - Event rectangle width
 * @param {number} height - Event rectangle height
 * @param {number} [alpha=1] - Opacity (matches search dim state)
 */
export function drawEventShapeIndicator(ctx, event, x, y, width, height, alpha = 1) {
  const shape = getEventShape(event);
  const size = Math.min(height * 0.28, 4);
  if (size < 1) return;
  // Guard against incomplete canvas mock environments (e.g. jsdom in tests)
  if (typeof ctx.arc !== 'function') return;

  // Position: small shape in the left portion of the rectangle
  const cx = x + Math.min(width * 0.5, height * 0.5);
  const cy = y + height / 2;

  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * 0.85;
  drawShape(ctx, shape, cx, cy, size, 'rgba(255, 255, 255, 0.9)');
  ctx.globalAlpha = prevAlpha;
}

/**
 * Get legend entries for shapes used in the given event set.
 * Each unique shape maps to the first category that produced it.
 *
 * @param {Array} events
 * @returns {Array<{shape: string, label: string, category: string}>}
 */
export function getShapeLegend(events) {
  const seen = new Map();
  for (const event of events) {
    const shape = getEventShape(event);
    const category = event.category || 'Uncategorized';
    if (!seen.has(shape)) {
      seen.set(shape, category);
    }
  }
  return Array.from(seen.entries()).map(([shape, category]) => ({
    shape,
    label: SHAPE_LABELS[shape],
    category,
  }));
}

/**
 * Check if the user's system prefers high contrast.
 * @returns {boolean}
 */
export function prefersHighContrast() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-contrast: more)').matches;
}

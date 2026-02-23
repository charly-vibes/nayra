/**
 * Parallel accessible DOM structure synchronized with the canvas timeline.
 *
 * Creates a visually-hidden semantic nav/ul/li tree that mirrors the visible
 * canvas so screen readers can navigate timeline events with arrow keys.
 *
 * WCAG 2.1 AA:
 *   - 1.3.1 Info and Relationships (Level A)
 *   - 4.1.2 Name, Role, Value (Level A)
 */

/**
 * Create a DOM-sync instance that maintains a hidden accessible list of events.
 *
 * @param {HTMLElement} container - Element to append the nav landmark into
 * @param {{ onFocus?: (id: string) => void, onActivate?: (id: string) => void }} [options]
 * @returns {{ update: (events: Array) => void, destroy: () => void }}
 */
export function createDomSync(container, options = {}) {
  const { onFocus, onActivate } = options;

  // --- Build the landmark ---
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Timeline events');

  // Visually hidden but accessible (sr-only pattern)
  Object.assign(nav.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  const ul = document.createElement('ul');
  ul.setAttribute('role', 'list');
  nav.appendChild(ul);
  container.appendChild(nav);

  // Track rendered items by event id for diffing
  /** @type {Map<string, HTMLElement>} */
  const itemMap = new Map();

  // --- Helpers ---

  function buildAriaLabel(event) {
    const label = event.title || event.label || '';
    return label;
  }

  function createItem(event) {
    const li = document.createElement('li');
    li.setAttribute('aria-label', buildAriaLabel(event));

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = event.title || event.label || '';

    if (onFocus) {
      btn.addEventListener('focus', () => onFocus(event.id));
    }
    if (onActivate) {
      btn.addEventListener('click', () => onActivate(event.id));
    }

    li.appendChild(btn);
    return li;
  }

  // --- Public API ---

  /**
   * Reconcile the DOM list to match the given events array.
   * Adds new items, removes stale ones; preserves unchanged items in place.
   *
   * @param {Array} events
   */
  function update(events) {
    const nextIds = new Set(events.map((e) => e.id));

    // Remove items no longer in the list
    for (const [id, li] of itemMap) {
      if (!nextIds.has(id)) {
        ul.removeChild(li);
        itemMap.delete(id);
      }
    }

    // Add new items (append in order; reorder not needed for screen-reader use)
    for (const event of events) {
      if (!itemMap.has(event.id)) {
        const li = createItem(event);
        ul.appendChild(li);
        itemMap.set(event.id, li);
      }
    }
  }

  /** Remove the landmark from the DOM and clear internal state. */
  function destroy() {
    if (nav.parentNode) {
      nav.parentNode.removeChild(nav);
    }
    itemMap.clear();
  }

  return { update, destroy };
}

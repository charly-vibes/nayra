const FEATURE_LABELS = {
  canvas: 'Canvas 2D API',
  bigint: 'BigInt',
  indexeddb: 'IndexedDB',
};

/**
 * Render a user-friendly error screen when required browser features are missing.
 *
 * @param {HTMLElement} container - Parent element to render into
 * @param {string[]} missingFeatures - Array of feature keys (e.g. ['bigint', 'canvas'])
 * @returns {{ element: HTMLElement }}
 */
export function createBrowserError(container, missingFeatures) {
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('aria-atomic', 'true');
  overlay.setAttribute('tabindex', '-1');
  applyStyles(overlay, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    color: '#e0e0e0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: '9999',
    padding: '2rem',
  });

  const card = document.createElement('div');
  applyStyles(card, {
    maxWidth: '480px',
    width: '100%',
    background: '#2a2a3e',
    border: '1px solid #4a4a6a',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
  });

  const icon = document.createElement('div');
  icon.textContent = '⚠️';
  icon.setAttribute('aria-hidden', 'true');
  applyStyles(icon, { fontSize: '3rem', marginBottom: '1rem' });

  const title = document.createElement('h2');
  title.textContent = 'Browser Not Supported';
  applyStyles(title, {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ff6b6b',
    marginBottom: '0.75rem',
  });

  const message = document.createElement('p');
  message.textContent =
    missingFeatures.length > 0
      ? 'Nayra requires the following browser features that are not available:'
      : 'Your browser appears to be missing required features.';
  applyStyles(message, {
    color: '#b0b0c8',
    marginBottom: '1.25rem',
    lineHeight: '1.5',
  });

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(message);

  if (missingFeatures.length > 0) {
    const list = document.createElement('ul');
    list.setAttribute('aria-label', 'Missing browser features');
    applyStyles(list, {
      listStyle: 'none',
      margin: '0 0 1.5rem',
      padding: '0',
      textAlign: 'left',
    });

    for (const key of missingFeatures) {
      const item = document.createElement('li');
      applyStyles(item, {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.75rem',
        background: '#1a1a2e',
        borderRadius: '6px',
        marginBottom: '0.4rem',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        color: '#ff6b6b',
      });
      const mark = document.createElement('span');
      mark.textContent = '✗';
      mark.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = FEATURE_LABELS[key] ?? key;
      item.appendChild(mark);
      item.appendChild(label);
      list.appendChild(item);
    }
    card.appendChild(list);
  }

  const suggestion = document.createElement('p');
  applyStyles(suggestion, { color: '#b0b0c8', fontSize: '0.9rem', lineHeight: '1.5' });
  suggestion.textContent =
    'Please upgrade to a modern browser such as ';

  const browsers = document.createElement('strong');
  browsers.textContent = 'Chrome 90+, Firefox 90+, or Safari 14+';
  applyStyles(browsers, { color: '#00d9ff' });
  suggestion.appendChild(browsers);
  suggestion.append('.');

  card.appendChild(suggestion);
  overlay.appendChild(card);
  container.appendChild(overlay);

  // Focus the overlay so screen readers announce it immediately
  overlay.focus();

  return { element: overlay };
}

function applyStyles(el, styles) {
  Object.assign(el.style, styles);
}

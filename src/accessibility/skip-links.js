/**
 * Skip Navigation Links
 * WCAG 2.4.1 Bypass Blocks (Level A)
 * WCAG 2.1.1 Keyboard (Level A)
 *
 * Creates skip links as the first focusable elements on the page.
 * Links are visually hidden by default (off-screen) and appear on focus
 * with high-contrast styling.
 */

/**
 * Create skip navigation links.
 *
 * @param {HTMLElement} container - Element to prepend the nav into (usually document.body)
 * @param {Array<{label: string, targetId?: string, onClick?: Function}>} links
 *   - label: visible link text
 *   - targetId: ID of target element to focus on activation
 *   - onClick: optional custom handler (overrides targetId focus)
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createSkipLinks(container, links) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Skip navigation');
  nav.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 9999;';

  const skipElements = links.map(({ label, targetId, onClick }) => {
    const link = document.createElement('a');
    link.href = targetId ? `#${targetId}` : '#';
    link.textContent = label;
    link.className = 'skip-link';

    applyHiddenStyles(link);

    link.addEventListener('focus', () => showLink(link));
    link.addEventListener('blur', () => applyHiddenStyles(link));

    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateLink(targetId, onClick);
    });

    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateLink(targetId, onClick);
      }
    });

    nav.appendChild(link);
    return link;
  });

  // Insert as first child so it's the first focusable element
  container.insertBefore(nav, container.firstChild);

  function destroy() {
    container.removeChild(nav);
  }

  return { element: nav, links: skipElements, destroy };
}

function applyHiddenStyles(el) {
  el.style.position = 'absolute';
  el.style.left = '-10000px';
  el.style.top = '0';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.overflow = 'hidden';
  el.style.backgroundColor = '#2563eb';
  el.style.color = '#ffffff';
  el.style.padding = '8px 16px';
  el.style.fontSize = '14px';
  el.style.fontWeight = '600';
  el.style.fontFamily = 'system-ui, sans-serif';
  el.style.textDecoration = 'none';
  el.style.borderRadius = '0 0 4px 4px';
  el.style.whiteSpace = 'nowrap';
  el.style.outlineColor = '#ffffff';
  el.style.outlineWidth = '3px';
  el.style.outlineStyle = 'solid';
  el.style.zIndex = '9999';
}

function showLink(el) {
  el.style.left = '0px';
  el.style.width = 'auto';
  el.style.height = 'auto';
  el.style.overflow = 'visible';
}

function activateLink(targetId, onClick) {
  if (onClick) {
    onClick();
    return;
  }
  if (targetId) {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}

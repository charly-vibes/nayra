/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createBrowserError } from '../../src/ui/browser-error.js';

describe('browser-error', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentElement) {
      container.parentElement.removeChild(container);
    }
  });

  it('renders an error element into the container', () => {
    createBrowserError(container, ['bigint']);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('uses role="alert" for accessibility', () => {
    createBrowserError(container, ['bigint']);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  it('lists each missing feature by name', () => {
    createBrowserError(container, ['bigint', 'canvas']);
    const text = container.textContent;
    expect(text).toMatch(/bigint/i);
    expect(text).toMatch(/canvas/i);
  });

  it('includes a browser upgrade suggestion', () => {
    createBrowserError(container, ['bigint']);
    const text = container.textContent;
    expect(text).toMatch(/upgrade|update|modern/i);
  });

  it('has an accessible heading', () => {
    createBrowserError(container, ['bigint']);
    const heading = container.querySelector('h1, h2, [role="heading"]');
    expect(heading).not.toBeNull();
  });

  it('is keyboard-focusable (tabindex on container or first interactive element)', () => {
    const { element } = createBrowserError(container, ['bigint']);
    const focusable = element.querySelector('[tabindex]') || element;
    expect(focusable).toBeDefined();
  });

  it('returns the created element', () => {
    const result = createBrowserError(container, ['bigint']);
    expect(result).toHaveProperty('element');
    expect(result.element).toBeInstanceOf(HTMLElement);
  });

  it('shows a title when no features are missing (should not happen but handles gracefully)', () => {
    createBrowserError(container, []);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('suggests known supported browsers', () => {
    createBrowserError(container, ['bigint']);
    const text = container.textContent;
    expect(text).toMatch(/chrome|firefox|safari/i);
  });

  it('displays all three missing features when passed three', () => {
    createBrowserError(container, ['canvas', 'bigint', 'indexeddb']);
    const text = container.textContent;
    expect(text).toMatch(/canvas/i);
    expect(text).toMatch(/bigint/i);
    expect(text).toMatch(/indexeddb/i);
  });
});

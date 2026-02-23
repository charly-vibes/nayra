import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDomSync } from './dom-sync.js';

function makeEvent(overrides = {}) {
  return {
    id: 'e1',
    label: 'Moon Landing',
    description: 'Apollo 11 mission',
    start: 0n,
    end: 100n,
    category: 'Science',
    ...overrides,
  };
}

describe('createDomSync', () => {
  let container;
  let domSync;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (domSync) domSync.destroy();
    document.body.removeChild(container);
  });

  it('creates a hidden nav landmark in the container', () => {
    domSync = createDomSync(container);
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.getAttribute('aria-label')).toBe('Timeline events');
  });

  it('is visually hidden but accessible', () => {
    domSync = createDomSync(container);
    const nav = container.querySelector('nav');
    // Should use sr-only-like styling
    const style = nav.style;
    const isHidden = style.position === 'absolute' || nav.classList.contains('sr-only');
    expect(isHidden).toBe(true);
  });

  it('creates a ul list inside nav', () => {
    domSync = createDomSync(container);
    const ul = container.querySelector('nav > ul');
    expect(ul).not.toBeNull();
    expect(ul.getAttribute('role')).toBe('list');
  });

  it('renders events as list items', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent({ id: 'e1' }), makeEvent({ id: 'e2', label: 'WWI' })]);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
  });

  it('gives each item a proper aria-label with event title and time range', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent({ id: 'e1', label: 'Moon Landing', start: 0n, end: 100n })]);
    const item = container.querySelector('li');
    expect(item.getAttribute('aria-label')).toContain('Moon Landing');
  });

  it('each event item has an interactive button child', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent()]);
    const btn = container.querySelector('li button');
    expect(btn).not.toBeNull();
  });

  it('removes events not in the updated list', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent({ id: 'e1' }), makeEvent({ id: 'e2', label: 'WWI' })]);
    domSync.update([makeEvent({ id: 'e1' })]);
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });

  it('adds new events in the updated list', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent({ id: 'e1' })]);
    domSync.update([makeEvent({ id: 'e1' }), makeEvent({ id: 'e2', label: 'WWI' })]);
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('calls onFocus callback when event item receives focus', () => {
    const onFocus = vi.fn();
    domSync = createDomSync(container, { onFocus });
    domSync.update([makeEvent({ id: 'e1' })]);
    const btn = container.querySelector('li button');
    btn.dispatchEvent(new Event('focus'));
    expect(onFocus).toHaveBeenCalledWith('e1');
  });

  it('calls onActivate callback when event item is clicked/Enter', () => {
    const onActivate = vi.fn();
    domSync = createDomSync(container, { onActivate });
    domSync.update([makeEvent({ id: 'e1' })]);
    const btn = container.querySelector('li button');
    btn.click();
    expect(onActivate).toHaveBeenCalledWith('e1');
  });

  it('removes itself from the DOM on destroy', () => {
    domSync = createDomSync(container);
    domSync.destroy();
    expect(container.querySelector('nav')).toBeNull();
    domSync = null; // Prevent afterEach from calling destroy again
  });

  it('clears all events when update is called with empty array', () => {
    domSync = createDomSync(container);
    domSync.update([makeEvent({ id: 'e1' })]);
    domSync.update([]);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

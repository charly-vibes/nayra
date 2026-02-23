// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSkipLinks } from './skip-links.js';

describe('createSkipLinks', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('creates a nav with aria-label "Skip navigation"', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    expect(element.tagName).toBe('NAV');
    expect(element.getAttribute('aria-label')).toBe('Skip navigation');
  });

  it('inserts nav as first child of container', () => {
    const existing = document.createElement('div');
    container.appendChild(existing);

    createSkipLinks(container, [{ label: 'Skip to timeline', targetId: 'timeline' }]);

    expect(container.firstChild.tagName).toBe('NAV');
  });

  it('creates one link per entry', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
      { label: 'Skip to search', targetId: 'search' },
      { label: 'Skip to help', targetId: 'help' },
    ]);
    const links = element.querySelectorAll('a');
    expect(links).toHaveLength(3);
  });

  it('link text matches label', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    expect(element.querySelector('a').textContent).toBe('Skip to timeline');
  });

  it('link href uses targetId', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline-canvas' },
    ]);
    expect(element.querySelector('a').getAttribute('href')).toBe('#timeline-canvas');
  });

  it('link is visually hidden by default (off-screen)', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    const link = element.querySelector('a');
    expect(link.style.left).toBe('-10000px');
  });

  it('link becomes visible on focus', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    const link = element.querySelector('a');
    link.dispatchEvent(new Event('focus'));
    expect(link.style.left).not.toBe('-10000px');
  });

  it('link goes back to hidden on blur', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    const link = element.querySelector('a');
    link.dispatchEvent(new Event('focus'));
    link.dispatchEvent(new Event('blur'));
    expect(link.style.left).toBe('-10000px');
  });

  it('click focuses target element', () => {
    const target = document.createElement('div');
    target.id = 'timeline-canvas';
    target.tabIndex = 0;
    document.body.appendChild(target);
    const focusSpy = vi.spyOn(target, 'focus');

    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline-canvas' },
    ]);
    element.querySelector('a').click();

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(target);
  });

  it('onClick handler is called when provided instead of targetId', () => {
    const handler = vi.fn();
    const { element } = createSkipLinks(container, [
      { label: 'Skip to search', onClick: handler },
    ]);
    element.querySelector('a').click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('Enter key activates the link', () => {
    const handler = vi.fn();
    const { element } = createSkipLinks(container, [
      { label: 'Skip to search', onClick: handler },
    ]);
    const link = element.querySelector('a');
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('Space key activates the link', () => {
    const handler = vi.fn();
    const { element } = createSkipLinks(container, [
      { label: 'Skip to search', onClick: handler },
    ]);
    const link = element.querySelector('a');
    link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('destroy removes the nav from container', () => {
    const { destroy } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    destroy();
    expect(container.querySelector('nav')).toBeNull();
  });

  it('links have high contrast styling', () => {
    const { element } = createSkipLinks(container, [
      { label: 'Skip to timeline', targetId: 'timeline' },
    ]);
    const link = element.querySelector('a');
    expect(link.style.backgroundColor).toBe('rgb(37, 99, 235)'); // #2563eb
    expect(link.style.color).toBe('rgb(255, 255, 255)'); // white
  });
});

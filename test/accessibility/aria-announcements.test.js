// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLiveAnnouncer } from '../../src/accessibility/live-announcer.js';
import { createAriaAnnouncer } from '../../src/accessibility/aria-announcer.js';

describe('createAriaAnnouncer', () => {
  let element;
  let liveAnnouncer;
  let ariaAnnouncer;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    document.body.appendChild(element);
    liveAnnouncer = createLiveAnnouncer(element, { debounceMs: 500 });
    ariaAnnouncer = createAriaAnnouncer(liveAnnouncer);
  });

  afterEach(() => {
    ariaAnnouncer.destroy();
    document.body.removeChild(element);
    vi.useRealTimers();
  });

  describe('creation', () => {
    it('can be created with an existing live announcer', () => {
      expect(ariaAnnouncer).toBeDefined();
      expect(typeof ariaAnnouncer.announceResults).toBe('function');
      expect(typeof ariaAnnouncer.announceNavigation).toBe('function');
      expect(typeof ariaAnnouncer.announceFilterChange).toBe('function');
      expect(typeof ariaAnnouncer.clear).toBe('function');
    });

    it('can be created directly with a DOM element', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const announcer = createAriaAnnouncer(el, { debounceMs: 100 });
      announcer.announceResults(5, 'test');
      vi.advanceTimersByTime(100);
      expect(el.textContent).toContain('5');
      announcer.destroy();
      document.body.removeChild(el);
    });
  });

  describe('announceResults', () => {
    it('announces result count with query after debounce', () => {
      ariaAnnouncer.announceResults(15, 'moon');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("15 results found for 'moon'");
    });

    it('uses singular for 1 result', () => {
      ariaAnnouncer.announceResults(1, 'apollo');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("1 result found for 'apollo'");
    });

    it('announces zero results', () => {
      ariaAnnouncer.announceResults(0, 'xyz');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("No results found for 'xyz'");
    });

    it('announces result count without query', () => {
      ariaAnnouncer.announceResults(8);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('8 results found');
    });

    it('announces zero without query', () => {
      ariaAnnouncer.announceResults(0);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('No results');
    });

    it('debounces rapid result count updates', () => {
      ariaAnnouncer.announceResults(1, 'm');
      ariaAnnouncer.announceResults(3, 'mo');
      ariaAnnouncer.announceResults(7, 'moo');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("7 results found for 'moo'");
    });
  });

  describe('announceNavigation', () => {
    it('announces current position in results', () => {
      ariaAnnouncer.announceNavigation(2, 15);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Result 3 of 15');
    });

    it('announces first result correctly (1-based)', () => {
      ariaAnnouncer.announceNavigation(0, 5);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Result 1 of 5');
    });

    it('announces last result correctly', () => {
      ariaAnnouncer.announceNavigation(14, 15);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Result 15 of 15');
    });

    it('does nothing when total is 0', () => {
      ariaAnnouncer.announceNavigation(0, 0);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('');
    });
  });

  describe('announceFilterChange', () => {
    it('announces filter applied with result count', () => {
      ariaAnnouncer.announceFilterChange(8);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Category filter applied, 8 results');
    });

    it('uses singular for 1 result', () => {
      ariaAnnouncer.announceFilterChange(1);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Category filter applied, 1 result');
    });

    it('announces no results from filter', () => {
      ariaAnnouncer.announceFilterChange(0);
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('Category filter applied, no results');
    });
  });

  describe('clear', () => {
    it('clears the live region immediately', () => {
      ariaAnnouncer.announceResults(5, 'test');
      vi.advanceTimersByTime(500);
      ariaAnnouncer.clear();
      expect(element.textContent).toBe('');
    });

    it('cancels pending announcement', () => {
      ariaAnnouncer.announceResults(5, 'test');
      ariaAnnouncer.clear();
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe('');
    });
  });

  describe('debounce behavior', () => {
    it('does not announce before debounce delay', () => {
      ariaAnnouncer.announceResults(10, 'query');
      vi.advanceTimersByTime(499);
      expect(element.textContent).toBe('');
    });

    it('announces exactly at debounce delay', () => {
      ariaAnnouncer.announceResults(10, 'query');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("10 results found for 'query'");
    });

    it('last call wins when multiple calls within debounce window', () => {
      ariaAnnouncer.announceResults(3, 'a');
      vi.advanceTimersByTime(200);
      ariaAnnouncer.announceResults(7, 'ab');
      vi.advanceTimersByTime(500);
      expect(element.textContent).toBe("7 results found for 'ab'");
    });
  });
});

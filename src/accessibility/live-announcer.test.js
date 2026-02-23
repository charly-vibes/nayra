// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLiveAnnouncer } from './live-announcer.js';

describe('createLiveAnnouncer', () => {
  let element;
  let announcer;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (announcer) announcer.destroy();
    document.body.removeChild(element);
    vi.useRealTimers();
  });

  it('creates an announcer without throwing', () => {
    announcer = createLiveAnnouncer(element);
    expect(announcer).toBeDefined();
    expect(typeof announcer.announce).toBe('function');
    expect(typeof announcer.announceImmediate).toBe('function');
    expect(typeof announcer.clear).toBe('function');
    expect(typeof announcer.destroy).toBe('function');
  });

  describe('announce (debounced)', () => {
    it('does not update element immediately', () => {
      announcer = createLiveAnnouncer(element);
      announcer.announce('hello');
      expect(element.textContent).toBe('');
    });

    it('updates element after debounce delay', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('hello');
      vi.advanceTimersByTime(300);
      expect(element.textContent).toBe('hello');
    });

    it('debounces rapid calls — only last message is announced', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('first');
      announcer.announce('second');
      announcer.announce('third');
      vi.advanceTimersByTime(300);
      expect(element.textContent).toBe('third');
    });

    it('cancels previous timer on each new call', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('early');
      vi.advanceTimersByTime(100);
      announcer.announce('later');
      vi.advanceTimersByTime(200); // only 200ms after second call
      expect(element.textContent).toBe(''); // not yet announced
      vi.advanceTimersByTime(100); // now 300ms after second call
      expect(element.textContent).toBe('later');
    });

    it('uses 500ms debounce by default', () => {
      announcer = createLiveAnnouncer(element);
      announcer.announce('hello');
      vi.advanceTimersByTime(499);
      expect(element.textContent).toBe('');
      vi.advanceTimersByTime(1);
      expect(element.textContent).toBe('hello');
    });
  });

  describe('announceImmediate', () => {
    it('updates element immediately without waiting for debounce', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 500 });
      announcer.announceImmediate('urgent');
      expect(element.textContent).toBe('urgent');
    });

    it('cancels any pending debounced announcement', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('pending');
      announcer.announceImmediate('immediate');
      vi.advanceTimersByTime(300);
      expect(element.textContent).toBe('immediate'); // pending didn't overwrite
    });
  });

  describe('clear', () => {
    it('empties the element textContent', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('hello');
      vi.advanceTimersByTime(300);
      announcer.clear();
      expect(element.textContent).toBe('');
    });

    it('cancels any pending debounced announcement', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('pending');
      announcer.clear();
      vi.advanceTimersByTime(300);
      expect(element.textContent).toBe('');
    });
  });

  describe('destroy', () => {
    it('cancels pending timers without throwing', () => {
      announcer = createLiveAnnouncer(element, { debounceMs: 300 });
      announcer.announce('will be cancelled');
      announcer.destroy();
      vi.advanceTimersByTime(300);
      expect(element.textContent).toBe(''); // timer was cancelled
      announcer = null; // prevent afterEach double-destroy
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTooltip } from '../../src/ui/tooltip.js';

describe('createTooltip', () => {
  let container;
  let tooltip;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (tooltip) {
      tooltip.destroy();
      tooltip = null;
    }
    document.body.removeChild(container);
  });

  describe('DOM element creation', () => {
    it('creates a tooltip element in the container', () => {
      tooltip = createTooltip(container);
      expect(container.querySelector('.tooltip')).not.toBeNull();
    });

    it('has correct background color', () => {
      tooltip = createTooltip(container);
      const el = container.querySelector('.tooltip');
      expect(el.style.background).toBe('rgb(42, 42, 62)');
    });

    it('has correct border', () => {
      tooltip = createTooltip(container);
      const el = container.querySelector('.tooltip');
      expect(el.style.border).toBe('1px solid rgb(74, 74, 106)');
    });

    it('has 6px border radius', () => {
      tooltip = createTooltip(container);
      const el = container.querySelector('.tooltip');
      expect(el.style.borderRadius).toBe('6px');
    });

    it('has pointer-events: none', () => {
      tooltip = createTooltip(container);
      const el = container.querySelector('.tooltip');
      expect(el.style.pointerEvents).toBe('none');
    });

    it('is hidden by default', () => {
      tooltip = createTooltip(container);
      const el = container.querySelector('.tooltip');
      expect(el.style.display).toBe('none');
    });
  });

  describe('show/hide', () => {
    it('show() makes tooltip visible', () => {
      tooltip = createTooltip(container);
      tooltip.show();
      const el = container.querySelector('.tooltip');
      expect(el.style.display).toBe('block');
    });

    it('hide() makes tooltip invisible', () => {
      tooltip = createTooltip(container);
      tooltip.show();
      tooltip.hide();
      const el = container.querySelector('.tooltip');
      expect(el.style.display).toBe('none');
    });

    it('isVisible() returns correct state', () => {
      tooltip = createTooltip(container);
      expect(tooltip.isVisible()).toBe(false);
      tooltip.show();
      expect(tooltip.isVisible()).toBe(true);
      tooltip.hide();
      expect(tooltip.isVisible()).toBe(false);
    });
  });

  describe('update', () => {
    it('sets tooltip content from event label and time', () => {
      tooltip = createTooltip(container);
      const event = { label: 'Big Bang', start: -435495840000000000n };
      tooltip.update(event, 100, 200);
      const el = container.querySelector('.tooltip');
      expect(el.textContent).toContain('Big Bang');
    });

    it('positions tooltip at given coordinates', () => {
      tooltip = createTooltip(container);
      const event = { label: 'Test', start: 0n };
      tooltip.update(event, 150, 250);
      const el = container.querySelector('.tooltip');
      expect(el.style.left).toBe('160px');
      expect(el.style.top).toBe('260px');
    });
  });

  describe('viewport clamping', () => {
    it('clamps tooltip to right edge of viewport', () => {
      tooltip = createTooltip(container);
      const event = { label: 'Test Event', start: 0n };
      tooltip.update(event, window.innerWidth - 10, 100);
      const el = container.querySelector('.tooltip');
      const left = parseInt(el.style.left, 10);
      expect(left).toBeLessThanOrEqual(window.innerWidth - 50);
    });

    it('clamps tooltip to bottom edge of viewport', () => {
      tooltip = createTooltip(container);
      const event = { label: 'Test', start: 0n };
      tooltip.update(event, 100, window.innerHeight - 10);
      const el = container.querySelector('.tooltip');
      const top = parseInt(el.style.top, 10);
      expect(top).toBeLessThanOrEqual(window.innerHeight - 30);
    });
  });

  describe('destroy', () => {
    it('removes tooltip from container', () => {
      tooltip = createTooltip(container);
      tooltip.destroy();
      expect(container.querySelector('.tooltip')).toBeNull();
      tooltip = null;
    });
  });
});

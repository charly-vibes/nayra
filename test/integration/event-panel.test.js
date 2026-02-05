import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEventPanel } from '../../src/ui/event-panel.js';

describe('createEventPanel', () => {
  let container;
  let panel;
  let onClose;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onClose = vi.fn();
  });

  afterEach(() => {
    if (panel) {
      panel.destroy();
      panel = null;
    }
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('DOM structure', () => {
    it('creates an overlay element', () => {
      panel = createEventPanel(container, { onClose });
      expect(container.querySelector('.event-panel-overlay')).not.toBeNull();
    });

    it('creates a panel element inside overlay', () => {
      panel = createEventPanel(container, { onClose });
      expect(container.querySelector('.event-panel')).not.toBeNull();
    });

    it('panel has max-width 500px', () => {
      panel = createEventPanel(container, { onClose });
      const el = container.querySelector('.event-panel');
      expect(el.style.maxWidth).toBe('500px');
    });

    it('is hidden by default', () => {
      panel = createEventPanel(container, { onClose });
      const overlay = container.querySelector('.event-panel-overlay');
      expect(overlay.style.display).toBe('none');
    });
  });

  describe('accessibility', () => {
    it('has role=dialog', () => {
      panel = createEventPanel(container, { onClose });
      const el = container.querySelector('.event-panel');
      expect(el.getAttribute('role')).toBe('dialog');
    });

    it('has aria-modal=true', () => {
      panel = createEventPanel(container, { onClose });
      const el = container.querySelector('.event-panel');
      expect(el.getAttribute('aria-modal')).toBe('true');
    });

    it('has aria-label', () => {
      panel = createEventPanel(container, { onClose });
      const el = container.querySelector('.event-panel');
      expect(el.getAttribute('aria-label')).toBe('Event details');
    });
  });

  describe('show/hide', () => {
    it('show() makes panel visible', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      const overlay = container.querySelector('.event-panel-overlay');
      expect(overlay.style.display).toBe('flex');
    });

    it('hide() makes panel invisible', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      panel.hide();
      const overlay = container.querySelector('.event-panel-overlay');
      expect(overlay.style.display).toBe('none');
    });

    it('isVisible() returns correct state', () => {
      panel = createEventPanel(container, { onClose });
      expect(panel.isVisible()).toBe(false);
      panel.show();
      expect(panel.isVisible()).toBe(true);
      panel.hide();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('update', () => {
    it('displays event label as title', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Big Bang', start: -435495840000000000n };
      panel.update([event]);
      const title = container.querySelector('.event-panel-title');
      expect(title.textContent).toBe('Big Bang');
    });

    it('displays formatted time', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n };
      panel.update([event]);
      const time = container.querySelector('.event-panel-time');
      expect(time.textContent).toBeTruthy();
    });

    it('displays description if present', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n, description: 'A test description' };
      panel.update([event]);
      const desc = container.querySelector('.event-panel-description');
      expect(desc.textContent).toBe('A test description');
    });

    it('displays category if present', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n, category: 'science' };
      panel.update([event]);
      const cat = container.querySelector('.event-panel-category');
      expect(cat.textContent).toContain('science');
    });

    it('displays tags if present', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n, tags: ['physics', 'cosmology'] };
      panel.update([event]);
      const tags = container.querySelector('.event-panel-tags');
      expect(tags.textContent).toContain('physics');
      expect(tags.textContent).toContain('cosmology');
    });

    it('displays url as link if present', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n, url: 'https://example.com' };
      panel.update([event]);
      const link = container.querySelector('.event-panel-url a');
      expect(link.href).toBe('https://example.com/');
    });

    it('displays source if present', () => {
      panel = createEventPanel(container, { onClose });
      const event = { label: 'Test', start: 0n, source: 'wikidata:Q12345' };
      panel.update([event]);
      const src = container.querySelector('.event-panel-source');
      expect(src.textContent).toContain('wikidata:Q12345');
    });
  });

  describe('keyboard interaction', () => {
    it('Escape key hides panel and calls onClose', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      
      expect(panel.isVisible()).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Escape does nothing when panel is hidden', () => {
      panel = createEventPanel(container, { onClose });
      
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('backdrop click', () => {
    it('clicking backdrop closes panel and calls onClose', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      
      const overlay = container.querySelector('.event-panel-overlay');
      overlay.click();
      
      expect(panel.isVisible()).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clicking panel content does not close', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      
      const panelEl = container.querySelector('.event-panel');
      panelEl.click();
      
      expect(panel.isVisible()).toBe(true);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes panel from container', () => {
      panel = createEventPanel(container, { onClose });
      panel.destroy();
      expect(container.querySelector('.event-panel-overlay')).toBeNull();
      panel = null;
    });

    it('removes keydown listener', () => {
      panel = createEventPanel(container, { onClose });
      panel.show();
      panel.destroy();
      panel = null;
      
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

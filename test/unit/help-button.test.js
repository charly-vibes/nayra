import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createMockContainer() {
  const children = [];
  return {
    appendChild: vi.fn((child) => {
      children.push(child);
    }),
    removeChild: vi.fn((child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
    }),
    _children: children,
  };
}

function createMockDocument() {
  return {
    createElement: vi.fn((tag) => createMockElement(tag)),
  };
}

function createMockElement(tagName) {
  const listeners = {};
  const children = [];
  return {
    tagName: tagName.toUpperCase(),
    type: '',
    style: {},
    dataset: {},
    children,
    appendChild: vi.fn((child) => {
      children.push(child);
    }),
    removeChild: vi.fn((child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
    }),
    addEventListener: vi.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    removeEventListener: vi.fn((type, handler) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((h) => h !== handler);
      }
    }),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    textContent: '',
    _listeners: listeners,
    _dispatch(type, eventInit = {}) {
      const handlers = listeners[type] || [];
      handlers.forEach((h) => h(eventInit));
    },
  };
}

describe('Help Button', () => {
  let container;
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
    globalThis.document = createMockDocument();
    container = createMockContainer();
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  async function loadModule() {
    const mod = await import('../../src/ui/help-button.js');
    return mod.createHelpButton;
  }

  it('renders as <button type="button">', async () => {
    const createHelpButton = await loadModule();
    const btn = createHelpButton(container, { onToggleHelp: vi.fn() });

    expect(btn.element.tagName).toBe('BUTTON');
    expect(btn.element.type).toBe('button');
  });

  it('has aria-label="Help"', async () => {
    const createHelpButton = await loadModule();
    createHelpButton(container, { onToggleHelp: vi.fn() });

    expect(globalThis.document.createElement).toHaveBeenCalled();
    const el = container._children[0];
    expect(el.setAttribute).toHaveBeenCalledWith('aria-label', 'Help');
  });

  it('click triggers onToggleHelp callback', async () => {
    const createHelpButton = await loadModule();
    const onToggleHelp = vi.fn();
    const btn = createHelpButton(container, { onToggleHelp });

    btn.element._dispatch('click');

    expect(onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it('sets width and height to 48px via inline styles', async () => {
    const createHelpButton = await loadModule();
    const btn = createHelpButton(container, { onToggleHelp: vi.fn() });

    expect(btn.element.style.width).toBe('48px');
    expect(btn.element.style.height).toBe('48px');
  });

  it('pointerdown calls stopPropagation', async () => {
    const createHelpButton = await loadModule();
    const btn = createHelpButton(container, { onToggleHelp: vi.fn() });

    const event = { stopPropagation: vi.fn() };
    btn.element._dispatch('pointerdown', event);

    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('destroy() removes button from DOM', async () => {
    const createHelpButton = await loadModule();
    const btn = createHelpButton(container, { onToggleHelp: vi.fn() });

    expect(container._children.length).toBe(1);

    btn.destroy();

    expect(container.removeChild).toHaveBeenCalledWith(btn.element);
  });
});

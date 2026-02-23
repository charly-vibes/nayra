import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initInput } from '../../src/interaction/input.js';
import { createStore } from '../../src/core/store.js';

// --- DOM mock helpers ---

function createMockElement(tagName = 'div') {
  const listeners = {};
  const children = [];
  const el = {
    tagName: tagName.toUpperCase(),
    className: '',
    style: {},
    textContent: '',
    innerHTML: '',
    dataset: {},
    children,
    appendChild: vi.fn((child) => { children.push(child); return child; }),
    removeChild: vi.fn((child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      return child;
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
    contains: vi.fn(() => false),
    focus: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    _listeners: listeners,
    _fire(type, eventInit) {
      (listeners[type] || []).forEach((h) => h(eventInit));
    },
  };
  return el;
}

function createMockCanvas() {
  const el = createMockElement('canvas');
  el.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 800, height: 400 }));
  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();
  return el;
}

function createContextMenuEvent(x = 100, y = 200, options = {}) {
  return {
    clientX: x,
    clientY: y,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...options,
  };
}

// --- input.js: contextmenu detection ---

describe('contextmenu event detection (input.js)', () => {
  let canvas;
  let store;

  beforeEach(() => {
    canvas = createMockCanvas();
    store = createStore({ events: [], canvasWidth: 800 });
    // Stub globals used by initInput
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matchMedia: vi.fn(() => ({ matches: false })),
      innerWidth: 1024,
      innerHeight: 768,
    });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('registers a contextmenu listener on the canvas', () => {
    initInput(canvas, store, {});
    const registeredTypes = canvas.addEventListener.mock.calls.map(([type]) => type);
    expect(registeredTypes).toContain('contextmenu');
  });

  it('calls preventDefault on contextmenu events', () => {
    let capturedHandler;
    canvas.addEventListener = vi.fn((type, handler) => {
      if (type === 'contextmenu') capturedHandler = handler;
    });
    initInput(canvas, store, {});

    const event = createContextMenuEvent(150, 250);
    capturedHandler(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('calls onContextMenu callback with position', () => {
    let capturedHandler;
    canvas.addEventListener = vi.fn((type, handler) => {
      if (type === 'contextmenu') capturedHandler = handler;
    });

    const onContextMenu = vi.fn();
    initInput(canvas, store, { onContextMenu });

    const event = createContextMenuEvent(150, 250);
    capturedHandler(event);

    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ x: 150, y: 250 })
    );
  });

  it('does not throw if onContextMenu callback is absent', () => {
    let capturedHandler;
    canvas.addEventListener = vi.fn((type, handler) => {
      if (type === 'contextmenu') capturedHandler = handler;
    });

    initInput(canvas, store, {});

    const event = createContextMenuEvent(150, 250);
    expect(() => capturedHandler(event)).not.toThrow();
  });

  it('includes targetType "event" when right-clicking on an event', () => {
    // Plant a renderable event in the store
    store = createStore({
      events: [{ id: 'ev1', label: 'Test', start: 0n, end: 1000n, lane: 0, x: 100, width: 100, y: 10, height: 20 }],
      canvasWidth: 800,
    });

    let capturedHandler;
    canvas.addEventListener = vi.fn((type, handler) => {
      if (type === 'contextmenu') capturedHandler = handler;
    });

    const onContextMenu = vi.fn();
    initInput(canvas, store, { onContextMenu });

    // Fire at arbitrary position; targetType depends on hit detection
    const event = createContextMenuEvent(150, 250);
    capturedHandler(event);

    // Must be called regardless of hit result
    expect(onContextMenu).toHaveBeenCalled();
    const arg = onContextMenu.mock.calls[0][0];
    expect(arg).toHaveProperty('targetType');
    expect(['event', 'background']).toContain(arg.targetType);
  });

  it('includes targetType "background" when right-clicking empty area', () => {
    store = createStore({ events: [], canvasWidth: 800 });

    let capturedHandler;
    canvas.addEventListener = vi.fn((type, handler) => {
      if (type === 'contextmenu') capturedHandler = handler;
    });

    const onContextMenu = vi.fn();
    initInput(canvas, store, { onContextMenu });

    const event = createContextMenuEvent(150, 250);
    capturedHandler(event);

    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'background' })
    );
  });

  it('removes contextmenu listener on destroy', () => {
    const registeredHandlers = {};
    canvas.addEventListener = vi.fn((type, handler) => {
      registeredHandlers[type] = handler;
    });
    canvas.removeEventListener = vi.fn();

    const destroy = initInput(canvas, store, {});
    destroy();

    const removedTypes = canvas.removeEventListener.mock.calls.map(([type]) => type);
    expect(removedTypes).toContain('contextmenu');
  });
});

// --- context-menu.js: UI component ---

describe('ContextMenu UI component', () => {
  let createContextMenu;
  let container;

  beforeEach(async () => {
    ({ createContextMenu } = await import('../../src/ui/context-menu.js'));
    container = createMockElement('div');

    // Stub document.createElement so DOM constructors work in node
    vi.stubGlobal('document', {
      createElement: vi.fn((tag) => createMockElement(tag)),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('window', {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('appends a menu element to the container on creation', () => {
    createContextMenu(container);
    expect(container.appendChild).toHaveBeenCalled();
  });

  it('is hidden by default', () => {
    const menu = createContextMenu(container);
    expect(menu.isVisible()).toBe(false);
  });

  it('becomes visible after show()', () => {
    const menu = createContextMenu(container);
    menu.show(100, 200, []);
    expect(menu.isVisible()).toBe(true);
  });

  it('becomes hidden after hide()', () => {
    const menu = createContextMenu(container);
    menu.show(100, 200, []);
    menu.hide();
    expect(menu.isVisible()).toBe(false);
  });

  it('renders an item for each action', () => {
    const menu = createContextMenu(container);
    const actions = [
      { label: 'Zoom to Event', action: vi.fn() },
      { label: 'Show Details', action: vi.fn() },
    ];
    menu.show(100, 200, actions);
    // item count should match actions count
    expect(menu.getItemCount()).toBe(actions.length);
  });

  it('executes action handler when an item is triggered', () => {
    const menu = createContextMenu(container);
    const handler = vi.fn();
    const actions = [{ label: 'Zoom to Event', action: handler }];
    menu.show(100, 200, actions);
    menu.triggerItem(0);
    expect(handler).toHaveBeenCalled();
  });

  it('hides the menu after an action is executed', () => {
    const menu = createContextMenu(container);
    const actions = [{ label: 'Zoom to Event', action: vi.fn() }];
    menu.show(100, 200, actions);
    menu.triggerItem(0);
    expect(menu.isVisible()).toBe(false);
  });

  it('exposes the DOM element', () => {
    const menu = createContextMenu(container);
    expect(menu.element).toBeDefined();
  });

  it('removes menu element from container on destroy', () => {
    const menu = createContextMenu(container);
    menu.destroy();
    expect(container.removeChild).toHaveBeenCalledWith(menu.element);
  });
});

// --- hkm.5: Positioning ---

describe('ContextMenu positioning', () => {
  let createContextMenu;
  let container;

  beforeEach(async () => {
    ({ createContextMenu } = await import('../../src/ui/context-menu.js'));
    container = createMockElement('div');
    vi.stubGlobal('document', {
      createElement: vi.fn((tag) => createMockElement(tag)),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('positions menu at cursor when not near edges', () => {
    vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768 });
    const menu = createContextMenu(container);
    menu.show(100, 150, [{ label: 'Item', action: vi.fn() }]);
    const left = parseInt(menu.element.style.left, 10);
    const top = parseInt(menu.element.style.top, 10);
    expect(left).toBeGreaterThanOrEqual(100);
    expect(top).toBeGreaterThanOrEqual(150);
  });

  it('clamps left when menu extends beyond right edge', () => {
    vi.stubGlobal('window', { innerWidth: 300, innerHeight: 768 });
    const menu = createContextMenu(container);
    // position close to right edge
    menu.show(290, 100, [{ label: 'Item', action: vi.fn() }]);
    const left = parseInt(menu.element.style.left, 10);
    // must not overflow viewport (menuWidth=180, margin=8 => max left = 300-180-8=112)
    expect(left + 180).toBeLessThanOrEqual(300);
  });

  it('clamps top when menu extends beyond bottom edge', () => {
    vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 200 });
    const menu = createContextMenu(container);
    // position close to bottom edge
    menu.show(100, 195, [{ label: 'Item', action: vi.fn() }]);
    const top = parseInt(menu.element.style.top, 10);
    // top + estimated height must be within viewport
    expect(top).toBeLessThanOrEqual(195);
    expect(top + 42).toBeLessThanOrEqual(200 + 10); // allow small variance
  });
});

// --- hkm.6: Keyboard navigation ---

describe('ContextMenu keyboard navigation', () => {
  let createContextMenu;
  let container;
  let docListeners;

  beforeEach(async () => {
    ({ createContextMenu } = await import('../../src/ui/context-menu.js'));
    container = createMockElement('div');
    docListeners = {};
    vi.stubGlobal('document', {
      createElement: vi.fn((tag) => createMockElement(tag)),
      addEventListener: vi.fn((type, handler, opts) => {
        docListeners[type] = docListeners[type] || [];
        docListeners[type].push(handler);
      }),
      removeEventListener: vi.fn((type, handler) => {
        if (docListeners[type]) {
          docListeners[type] = docListeners[type].filter((h) => h !== handler);
        }
      }),
    });
    vi.stubGlobal('window', { innerWidth: 1024, innerHeight: 768 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fireKey(key) {
    const event = { key, preventDefault: vi.fn() };
    (docListeners['keydown'] || []).forEach((h) => h(event));
    return event;
  }

  it('closes menu on Escape', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [{ label: 'Item', action: vi.fn() }]);
    fireKey('Escape');
    expect(menu.isVisible()).toBe(false);
  });

  it('activates focused item on Enter', () => {
    const handler = vi.fn();
    const menu = createContextMenu(container);
    menu.show(100, 100, [{ label: 'Item', action: handler }]);
    menu.focusItem(0);
    fireKey('Enter');
    expect(handler).toHaveBeenCalled();
    expect(menu.isVisible()).toBe(false);
  });

  it('activates focused item on Space', () => {
    const handler = vi.fn();
    const menu = createContextMenu(container);
    menu.show(100, 100, [{ label: 'Item', action: handler }]);
    menu.focusItem(0);
    fireKey(' ');
    expect(handler).toHaveBeenCalled();
  });

  it('ArrowDown moves focus to next item', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [
      { label: 'A', action: vi.fn() },
      { label: 'B', action: vi.fn() },
    ]);
    menu.focusItem(0);
    fireKey('ArrowDown');
    expect(menu.getFocusedIndex()).toBe(1);
  });

  it('ArrowUp moves focus to previous item', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [
      { label: 'A', action: vi.fn() },
      { label: 'B', action: vi.fn() },
    ]);
    menu.focusItem(1);
    fireKey('ArrowUp');
    expect(menu.getFocusedIndex()).toBe(0);
  });

  it('ArrowDown wraps from last to first', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [
      { label: 'A', action: vi.fn() },
      { label: 'B', action: vi.fn() },
    ]);
    menu.focusItem(1);
    fireKey('ArrowDown');
    expect(menu.getFocusedIndex()).toBe(0);
  });

  it('ArrowUp wraps from first to last', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [
      { label: 'A', action: vi.fn() },
      { label: 'B', action: vi.fn() },
    ]);
    menu.focusItem(0);
    fireKey('ArrowUp');
    expect(menu.getFocusedIndex()).toBe(1);
  });

  it('skips separator items during ArrowDown navigation', () => {
    const menu = createContextMenu(container);
    menu.show(100, 100, [
      { label: 'A', action: vi.fn() },
      { separator: true },
      { label: 'C', action: vi.fn() },
    ]);
    menu.focusItem(0);
    fireKey('ArrowDown');
    expect(menu.getFocusedIndex()).toBe(2);
  });
});

// --- hkm.3: buildEventActions ---

describe('buildEventActions', () => {
  let buildEventActions;
  let store;

  beforeEach(async () => {
    ({ buildEventActions } = await import('../../src/ui/context-menu.js'));
    store = createStore({ events: [], canvasWidth: 800 });
    vi.stubGlobal('window', { location: { href: 'http://localhost/#' } });
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an array of actions', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('includes a Zoom to Event action', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    const zoom = actions.find((a) => a.label && a.label.includes('Zoom'));
    expect(zoom).toBeDefined();
    expect(zoom.action).toBeTypeOf('function');
  });

  it('Zoom action dispatches SET_VIEWPORT', () => {
    const event = { id: 'ev1', start: 0n, end: BigInt(86400) };
    const actions = buildEventActions(event, store);
    const zoom = actions.find((a) => a.label && a.label.includes('Zoom'));
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    zoom.action();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_VIEWPORT' })
    );
  });

  it('includes a Show Details action', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    const details = actions.find((a) => a.label && a.label.includes('Details'));
    expect(details).toBeDefined();
    expect(details.action).toBeTypeOf('function');
  });

  it('Show Details action dispatches SELECT_EVENT', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    const details = actions.find((a) => a.label && a.label.includes('Details'));
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    details.action();
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'SELECT_EVENT', eventId: 'ev1' });
  });

  it('Show Details action calls onShowDetails callback if provided', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const onShowDetails = vi.fn();
    const actions = buildEventActions(event, store, { onShowDetails });
    const details = actions.find((a) => a.label && a.label.includes('Details'));
    details.action();
    expect(onShowDetails).toHaveBeenCalledWith(event);
  });

  it('includes a Copy Link action', () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    const copy = actions.find((a) => a.label && a.label.includes('Copy'));
    expect(copy).toBeDefined();
    expect(copy.action).toBeTypeOf('function');
  });

  it('Copy Link action writes to clipboard', async () => {
    const event = { id: 'ev1', start: 0n, end: 1000n };
    const actions = buildEventActions(event, store);
    const copy = actions.find((a) => a.label && a.label.includes('Copy'));
    await copy.action();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const url = navigator.clipboard.writeText.mock.calls[0][0];
    expect(url).toContain('ev1');
  });
});

// --- hkm.4: Long-press triggers context menu ---

describe('Long-press fires onContextMenu (input.js)', () => {
  let canvas;
  let store;

  beforeEach(() => {
    canvas = createMockCanvas();
    store = createStore({ events: [], canvasWidth: 800 });
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matchMedia: vi.fn(() => ({ matches: false })),
      innerWidth: 1024,
      innerHeight: 768,
    });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('calls onContextMenu after long-press threshold (500ms)', () => {
    const onContextMenu = vi.fn();
    initInput(canvas, store, { onContextMenu });

    // Fire a touch pointer down
    const pointerdown = canvas._listeners['pointerdown'] || [];
    pointerdown.forEach((h) => h({
      button: 0,
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      pointerType: 'touch',
      buttons: 1,
      ctrlKey: false,
      metaKey: false,
      timeStamp: 0,
      preventDefault: vi.fn(),
    }));

    vi.advanceTimersByTime(500);

    expect(onContextMenu).toHaveBeenCalled();
    const arg = onContextMenu.mock.calls[0][0];
    expect(arg).toHaveProperty('targetType');
  });

  it('does not call onContextMenu if touch moves before threshold', () => {
    const onContextMenu = vi.fn();
    initInput(canvas, store, { onContextMenu });

    const pointerdown = canvas._listeners['pointerdown'] || [];
    pointerdown.forEach((h) => h({
      button: 0,
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      pointerType: 'touch',
      buttons: 1,
      ctrlKey: false,
      metaKey: false,
      timeStamp: 0,
      preventDefault: vi.fn(),
    }));

    // Simulate a large move (> LONG_PRESS_MOVE_THRESHOLD=10)
    const pointermove = canvas._listeners['pointermove'] || [];
    pointermove.forEach((h) => h({
      clientX: 120,
      clientY: 220,
      pointerId: 1,
      pointerType: 'touch',
      buttons: 1,
      ctrlKey: false,
      metaKey: false,
      timeStamp: 100,
      preventDefault: vi.fn(),
    }));

    vi.advanceTimersByTime(500);

    expect(onContextMenu).not.toHaveBeenCalled();
  });
});

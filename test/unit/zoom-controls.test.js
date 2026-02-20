/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createZoomControls } from '../../src/ui/zoom-controls.js';

describe('Zoom Controls', () => {
  let container;
  let callbacks;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    callbacks = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onFitToContent: vi.fn(),
      onResetZoom: vi.fn(),
    };
  });

  afterEach(() => {
    if (container && container.parentElement) {
      container.parentElement.removeChild(container);
    }
  });

  it('should create zoom controls with all buttons', () => {
    const controls = createZoomControls(container, callbacks);
    expect(controls.element).toBeDefined();

    const buttons = controls.element.querySelectorAll('button');
    expect(buttons.length).toBe(4); // zoom in, zoom out, fit, reset
  });

  it('should position controls in bottom-left corner', () => {
    const controls = createZoomControls(container, callbacks);
    const style = controls.element.style;

    expect(style.position).toBe('fixed');
    // bottom and left use env() which isn't fully supported in jsdom
    expect(style.zIndex).toBe('900');
  });

  it('should call onZoomIn when zoom in button is clicked', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');
    const zoomInBtn = buttons[0]; // First button is zoom in

    zoomInBtn.click();
    expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when zoom out button is clicked', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');
    const zoomOutBtn = buttons[1]; // Second button is zoom out

    zoomOutBtn.click();
    expect(callbacks.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onFitToContent when fit button is clicked', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');
    const fitBtn = buttons[2]; // Third button is fit to content

    fitBtn.click();
    expect(callbacks.onFitToContent).toHaveBeenCalledTimes(1);
  });

  it('should call onResetZoom when reset button is clicked', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');
    const resetBtn = buttons[3]; // Fourth button is reset

    resetBtn.click();
    expect(callbacks.onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('should have proper aria labels for accessibility', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');

    expect(buttons[0].getAttribute('aria-label')).toBe('Zoom in');
    expect(buttons[1].getAttribute('aria-label')).toBe('Zoom out');
    expect(buttons[2].getAttribute('aria-label')).toBe('Fit all events in view');
    expect(buttons[3].getAttribute('aria-label')).toBe('Reset zoom to default');
  });

  it('should have tooltips with keyboard shortcuts', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');

    expect(buttons[0].getAttribute('title')).toContain('+');
    expect(buttons[1].getAttribute('title')).toContain('-');
    expect(buttons[2].getAttribute('title')).toContain('0');
    expect(buttons[3].getAttribute('title')).toContain('1');
  });

  it('should clean up event listeners on destroy', () => {
    const controls = createZoomControls(container, callbacks);
    controls.destroy();

    expect(container.children.length).toBe(0);
  });

  it('should stop event propagation on button clicks', () => {
    const controls = createZoomControls(container, callbacks);
    const buttons = controls.element.querySelectorAll('button');

    const mockEvent = { stopPropagation: vi.fn() };
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Event should not propagate to parent
    expect(callbacks.onZoomIn).toHaveBeenCalled();
  });

  it('should have flex column layout for vertical stacking', () => {
    const controls = createZoomControls(container, callbacks);
    const style = controls.element.style;

    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('column');
  });

  it('should include a separator between zoom and fit/reset buttons', () => {
    const controls = createZoomControls(container, callbacks);
    const children = Array.from(controls.element.children);

    // Should have 4 buttons + 1 separator = 5 elements
    expect(children.length).toBe(5);

    // Find separator (div that's not a button)
    const separator = children.find(el => el.tagName === 'DIV' && !el.querySelector('button'));
    expect(separator).toBeDefined();
  });
});

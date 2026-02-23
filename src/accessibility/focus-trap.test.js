// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFocusTrap } from './focus-trap.js';

function makeModal(...buttonLabels) {
  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.tabIndex = -1;

  for (const label of buttonLabels) {
    const btn = document.createElement('button');
    btn.textContent = label;
    modal.appendChild(btn);
  }
  document.body.appendChild(modal);
  return modal;
}

describe('createFocusTrap', () => {
  let modal;

  afterEach(() => {
    if (modal && modal.parentNode) {
      document.body.removeChild(modal);
    }
    modal = null;
  });

  it('returns activate, deactivate, destroy, getFocusableElements', () => {
    modal = makeModal('OK');
    const trap = createFocusTrap(modal);
    expect(typeof trap.activate).toBe('function');
    expect(typeof trap.deactivate).toBe('function');
    expect(typeof trap.destroy).toBe('function');
    expect(typeof trap.getFocusableElements).toBe('function');
  });

  it('getFocusableElements returns focusable elements inside modal', () => {
    modal = makeModal('Close', 'Save');
    const trap = createFocusTrap(modal);
    const elements = trap.getFocusableElements();
    expect(elements).toHaveLength(2);
  });

  it('activate moves focus to first focusable element', () => {
    modal = makeModal('First', 'Second');
    const trap = createFocusTrap(modal);
    const buttons = modal.querySelectorAll('button');
    const focusSpy = vi.spyOn(buttons[0], 'focus');
    trap.activate();
    expect(focusSpy).toHaveBeenCalled();
    trap.deactivate();
  });

  it('Tab wraps from last to first element', () => {
    modal = makeModal('First', 'Last');
    const trap = createFocusTrap(modal);
    trap.activate();

    const buttons = modal.querySelectorAll('button');
    // Simulate focus on last button
    buttons[buttons.length - 1].focus();

    const focusSpy = vi.spyOn(buttons[0], 'focus');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(focusSpy).toHaveBeenCalled();
    trap.deactivate();
  });

  it('Shift+Tab wraps from first to last element', () => {
    modal = makeModal('First', 'Last');
    const trap = createFocusTrap(modal);
    trap.activate();

    const buttons = modal.querySelectorAll('button');
    // Simulate focus on first button
    buttons[0].focus();

    const focusSpy = vi.spyOn(buttons[buttons.length - 1], 'focus');

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    );

    expect(focusSpy).toHaveBeenCalled();
    trap.deactivate();
  });

  it('Escape calls onEscape callback', () => {
    modal = makeModal('Close');
    const onEscape = vi.fn();
    const trap = createFocusTrap(modal, { onEscape });
    trap.activate();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onEscape).toHaveBeenCalledOnce();
    trap.deactivate();
  });

  it('deactivate returns focus to trigger element', () => {
    modal = makeModal('Close');
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const trap = createFocusTrap(modal);
    trap.activate(trigger);
    trap.deactivate();

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });

  it('does not intercept Tab when inactive', () => {
    modal = makeModal('Button');
    const trap = createFocusTrap(modal);
    // Not activated — Tab should not be intercepted
    const buttons = modal.querySelectorAll('button');
    const focusSpy = vi.spyOn(buttons[0], 'focus');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('destroy deactivates and returns focus', () => {
    modal = makeModal('OK');
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    const trap = createFocusTrap(modal);
    trap.activate(trigger);
    trap.destroy();

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });

  it('single focusable element wraps to itself on Tab', () => {
    modal = makeModal('Only');
    const trap = createFocusTrap(modal);
    trap.activate();

    const button = modal.querySelector('button');
    button.focus();
    const focusSpy = vi.spyOn(button, 'focus');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(focusSpy).toHaveBeenCalled();
    trap.deactivate();
  });
});

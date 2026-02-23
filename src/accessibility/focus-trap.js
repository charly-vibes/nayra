/**
 * Focus Trap
 * WCAG 2.1.2 No Keyboard Trap (Level A) — trap focus with documented Escape to exit
 * WCAG 2.4.3 Focus Order (Level A)
 * WCAG 2.4.7 Focus Visible (Level AA)
 *
 * Traps keyboard focus within a modal element. Tab/Shift+Tab cycle through
 * the modal's focusable elements. Escape calls the onEscape handler.
 * On deactivate, focus returns to the element that triggered the modal.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Create a focus trap for a modal element.
 *
 * @param {HTMLElement} modalElement - The modal container to trap focus within
 * @param {Object} [options]
 * @param {Function} [options.onEscape] - Called when Escape is pressed
 * @returns {{ activate: Function, deactivate: Function, destroy: Function, getFocusableElements: Function }}
 */
export function createFocusTrap(modalElement, { onEscape } = {}) {
  let returnFocusElement = null;
  let isActive = false;

  function getFocusableElements() {
    return Array.from(modalElement.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
    );
  }

  function handleKeyDown(e) {
    if (!isActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (onEscape) onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: wrap backward from first to last
      if (active === first || !modalElement.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap forward from last to first
      if (active === last || !modalElement.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /**
   * Activate the focus trap.
   * @param {HTMLElement|null} [triggerElement] - Element that opened the modal;
   *   focus will return here on deactivate. Defaults to document.activeElement.
   */
  function activate(triggerElement = null) {
    returnFocusElement = triggerElement || document.activeElement;
    isActive = true;
    document.addEventListener('keydown', handleKeyDown, true);

    // Move focus to first focusable element in the modal
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // Fallback: focus the modal container itself
      if (modalElement.tabIndex === -1 || modalElement.tabIndex >= 0) {
        modalElement.focus();
      }
    }
  }

  /**
   * Deactivate the focus trap and return focus to trigger element.
   */
  function deactivate() {
    isActive = false;
    document.removeEventListener('keydown', handleKeyDown, true);
    if (returnFocusElement && typeof returnFocusElement.focus === 'function') {
      returnFocusElement.focus();
    }
    returnFocusElement = null;
  }

  function destroy() {
    deactivate();
  }

  return { activate, deactivate, destroy, getFocusableElements };
}

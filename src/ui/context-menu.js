import { zoomToEvent } from '../core/navigation.js';

const MIN_MARGIN = 8;
const MENU_WIDTH = 180;
const ITEM_HEIGHT = 34;
const MENU_PADDING = 8; // top + bottom padding

export function createContextMenu(container) {
  const element = document.createElement('div');
  element.className = 'context-menu';
  element.style.position = 'fixed';
  element.style.zIndex = '1002';
  element.style.background = '#2a2a3e';
  element.style.border = '1px solid #4a4a6a';
  element.style.borderRadius = '8px';
  element.style.padding = '4px 0';
  element.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
  element.style.color = '#ffffff';
  element.style.fontSize = '13px';
  element.style.fontFamily = 'system-ui, sans-serif';
  element.style.minWidth = `${MENU_WIDTH}px`;
  element.style.display = 'none';
  element.style.userSelect = 'none';

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.margin = '0';
  list.style.padding = '0';
  element.appendChild(list);

  container.appendChild(element);

  let currentActions = [];
  let visible = false;
  let focusedIndex = -1;
  let renderedItems = []; // elements for each action slot (null for separators)

  function hide() {
    element.style.display = 'none';
    visible = false;
    focusedIndex = -1;
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('keydown', onKeyDown);
  }

  function applyFocusStyle(index) {
    renderedItems.forEach((item, i) => {
      if (item) {
        item.style.background = i === index ? '#3a3a5e' : '';
        item.style.outline = i === index ? '1px solid #7a7aaa' : '';
      }
    });
  }

  function focusItem(index) {
    focusedIndex = index;
    applyFocusStyle(focusedIndex);
  }

  function getFocusedIndex() {
    return focusedIndex;
  }

  function nextSelectableIndex(from, direction) {
    const len = currentActions.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!currentActions[idx].separator) return idx;
    }
    return from;
  }

  function onKeyDown(e) {
    if (!visible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const start = focusedIndex < 0 ? -1 : focusedIndex;
      focusItem(nextSelectableIndex(start, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const len = currentActions.length;
      const start = focusedIndex < 0 ? len : focusedIndex;
      focusItem(nextSelectableIndex(start, -1));
    } else if ((e.key === 'Enter' || e.key === ' ') && focusedIndex >= 0) {
      e.preventDefault();
      triggerItem(focusedIndex);
    }
  }

  function onDocumentClick(e) {
    if (!element.contains(e.target)) {
      hide();
    }
  }

  function show(x, y, actions) {
    currentActions = actions;
    renderedItems = [];

    // Rebuild list
    list.innerHTML = '';
    actions.forEach((action, index) => {
      if (action.separator) {
        const hr = document.createElement('li');
        hr.style.height = '1px';
        hr.style.background = '#4a4a6a';
        hr.style.margin = '4px 0';
        list.appendChild(hr);
        renderedItems.push(null);
        return;
      }

      const item = document.createElement('li');
      item.style.padding = '7px 16px';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';
      item.dataset.index = String(index);

      if (action.icon) {
        const icon = document.createElement('span');
        icon.textContent = action.icon;
        icon.style.opacity = '0.7';
        item.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = action.label;
      item.appendChild(label);

      if (action.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = action.shortcut;
        shortcut.style.marginLeft = 'auto';
        shortcut.style.opacity = '0.5';
        shortcut.style.fontSize = '11px';
        item.appendChild(shortcut);
      }

      item.addEventListener('mouseenter', () => {
        focusItem(index);
      });
      item.addEventListener('mouseleave', () => {
        if (focusedIndex === index) {
          focusedIndex = -1;
          applyFocusStyle(-1);
        }
      });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerItem(index);
      });

      list.appendChild(item);
      renderedItems.push(item);
    });

    // Compute menu height estimate
    const actionCount = actions.filter((a) => !a.separator).length;
    const sepCount = actions.filter((a) => a.separator).length;
    const menuHeight = actionCount * ITEM_HEIGHT + sepCount * 9 + MENU_PADDING;

    // Positioning with flip
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x;
    let top = y;

    if (left + MENU_WIDTH > vw - MIN_MARGIN) {
      left = Math.max(MIN_MARGIN, x - MENU_WIDTH);
    }
    if (top + menuHeight > vh - MIN_MARGIN) {
      top = Math.max(MIN_MARGIN, y - menuHeight);
    }

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.display = 'block';
    visible = true;
    focusedIndex = -1;

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onKeyDown);
  }

  function isVisible() {
    return visible;
  }

  function getItemCount() {
    return currentActions.filter((a) => !a.separator).length;
  }

  function triggerItem(index) {
    const action = currentActions[index];
    if (action && !action.separator && action.action) {
      hide();
      action.action();
    }
  }

  return {
    element,
    show,
    hide,
    isVisible,
    getItemCount,
    triggerItem,
    focusItem,
    getFocusedIndex,
    destroy() {
      hide();
      container.removeChild(element);
    },
  };
}

/**
 * Build the standard action list for an event context menu.
 *
 * @param {object} event - The event being right-clicked
 * @param {object} store - App store with getState() / dispatch()
 * @param {{ onShowDetails?: Function }} callbacks
 * @returns {Array} Action descriptor objects
 */
export function buildEventActions(event, store, { onShowDetails } = {}) {
  return [
    {
      label: 'Zoom to Event',
      icon: '⌖',
      action() {
        const { canvasWidth } = store.getState();
        const { viewportStart, scale } = zoomToEvent(event, canvasWidth);
        store.dispatch({ type: 'SET_VIEWPORT', viewportStart, scale });
      },
    },
    {
      label: 'Show Details',
      icon: '☰',
      action() {
        store.dispatch({ type: 'SELECT_EVENT', eventId: event.id });
        if (onShowDetails) onShowDetails(event);
      },
    },
    { separator: true },
    {
      label: 'Copy Link',
      icon: '⎘',
      action() {
        const base = window.location.href.split('#')[0];
        const url = `${base}#event=${encodeURIComponent(event.id)}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
        }
      },
    },
  ];
}

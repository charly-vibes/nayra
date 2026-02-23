import { createDebouncedSearch } from '../core/search-engine.js';
import { createSearchNavigation } from './search-navigation.js';

/**
 * Create the search bar overlay.
 *
 * @param {HTMLElement} container - DOM element to mount into
 * @param {Function|Object} onSubmitOrOptions
 *   Either a legacy `onSubmit(query)` function (jump-to-time), or an options object:
 *   - `onSubmit(query)` - called on Enter when no search results; used for jump-to-time
 *   - `onSearch(query)` - called on input (debounced 150ms); used for event filtering
 *   - `onNext()` - called on Enter when results are active; navigate to next result
 *   - `onPrev()` - called on Shift+Enter; navigate to previous result
 */
export function createSearchBar(container, onSubmitOrOptions) {
  const { onSubmit, onSearch, onNext, onPrev } =
    typeof onSubmitOrOptions === 'function'
      ? { onSubmit: onSubmitOrOptions, onSearch: null, onNext: null, onPrev: null }
      : onSubmitOrOptions;

  const element = document.createElement('div');
  element.className = 'searchbar-overlay';
  element.style.position = 'fixed';
  element.style.top = '20%';
  element.style.left = '50%';
  element.style.transform = 'translateX(-50%)';
  element.style.zIndex = '1000';
  element.style.background = '#2a2a3e';
  element.style.border = '1px solid #4a4a6a';
  element.style.borderRadius = '8px';
  element.style.padding = '12px';
  element.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
  element.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Jump to time (e.g., 2000, 100 Ma, 4.5 Ga, Big Bang)';
  input.style.cssText = `
    width: 400px;
    padding: 8px 12px;
    font-size: 16px;
    font-family: monospace;
    background: #1a1a2e;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #ffffff;
    outline: none;
  `;

  const debouncedSearch = onSearch ? createDebouncedSearch(onSearch, 150) : null;

  // Navigation bar (shown when there are active search results)
  let hasResults = false;
  const navigation = (onNext || onPrev)
    ? createSearchNavigation(element, {
        onNext: onNext || (() => {}),
        onPrev: onPrev || (() => {}),
      })
    : null;

  // Filter count badge + clear-all row
  const filterRow = document.createElement('div');
  filterRow.style.cssText = `
    display: none;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 11px;
    color: #8888aa;
    font-family: monospace;
  `;

  const filterBadge = document.createElement('span');
  filterBadge.textContent = '';

  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Clear all filters';
  clearAllBtn.style.cssText = `
    background: transparent;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #8888aa;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 6px;
    font-family: monospace;
  `;

  const onClearAll = onSubmitOrOptions && typeof onSubmitOrOptions === 'object'
    ? onSubmitOrOptions.onClearAll
    : null;

  if (onClearAll) {
    clearAllBtn.addEventListener('click', () => {
      onClearAll();
      hide();
    });
  }

  filterRow.appendChild(filterBadge);
  filterRow.appendChild(clearAllBtn);
  element.appendChild(filterRow);

  input.addEventListener('input', () => {
    if (debouncedSearch) {
      debouncedSearch(input.value);
    }
  });

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        if (onPrev && hasResults) onPrev();
      } else if (hasResults && onNext) {
        onNext();
      } else {
        // Fall back to jump-to-time when no search results are active
        const value = input.value.trim();
        if (value && onSubmit) {
          onSubmit(value);
        }
        hide();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    }
  });

  element.appendChild(input);
  container.appendChild(element);

  function show() {
    element.style.display = 'block';
    input.focus();
  }

  function hide() {
    if (debouncedSearch) debouncedSearch.cancel();
    if (onSearch) onSearch('');
    element.style.display = 'none';
    input.value = '';
    hasResults = false;
    if (navigation) navigation.hide();
  }

  function isVisible() {
    return element.style.display !== 'none';
  }

  /**
   * Update the navigation counter and active filter count badge.
   * Called from main.js when store state changes.
   *
   * @param {number} currentIndex
   * @param {number} total
   * @param {number} [activeFilterCount=0] - Total count of active filters (search + categories)
   */
  function updateNavigation(currentIndex, total, activeFilterCount = 0) {
    hasResults = total > 0;
    if (navigation) navigation.update(currentIndex, total);
    // Update border color and filter badge to indicate active filters
    if (activeFilterCount > 0) {
      element.style.borderColor = '#6a6aaa';
      filterBadge.textContent = `${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`;
      filterRow.style.display = 'flex';
    } else {
      element.style.borderColor = '#4a4a6a';
      filterRow.style.display = 'none';
    }
  }

  function destroy() {
    if (debouncedSearch) debouncedSearch.cancel();
    container.removeChild(element);
  }

  return {
    element,
    show,
    hide,
    isVisible,
    updateNavigation,
    destroy,
  };
}

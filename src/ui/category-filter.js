/**
 * Category filter UI component.
 * Renders checkboxes for each available category, OR/AND mode toggle,
 * and a "Clear all" button.
 */

const STYLES = {
  panel: `
    position: fixed;
    top: 20%;
    right: 16px;
    z-index: 900;
    background: #2a2a3e;
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    padding: 12px;
    min-width: 180px;
    max-height: 60vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    font-family: monospace;
    font-size: 13px;
    color: #ccccee;
    display: none;
  `,
  heading: `
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8888aa;
    margin: 0 0 8px;
  `,
  row: `
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    cursor: pointer;
  `,
  modeBar: `
    display: flex;
    gap: 4px;
    margin: 8px 0;
  `,
  modeBtn: `
    flex: 1;
    background: #3a3a5a;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #ccccee;
    cursor: pointer;
    font-size: 11px;
    padding: 3px 0;
  `,
  modeBtnActive: `
    flex: 1;
    background: #4a4a8a;
    border: 1px solid #6a6aaa;
    border-radius: 4px;
    color: #ffffff;
    cursor: pointer;
    font-size: 11px;
    padding: 3px 0;
  `,
  clearBtn: `
    width: 100%;
    background: transparent;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #8888aa;
    cursor: pointer;
    font-size: 11px;
    padding: 4px 0;
    margin-top: 8px;
  `,
};

/**
 * Create the category filter panel.
 *
 * @param {HTMLElement} container
 * @param {{ onToggle, onSetMode, onClear }} callbacks
 * @returns {{ show, hide, isVisible, setCategories, setSelected, setMode, destroy, element }}
 */
export function createCategoryFilter(container, { onToggle, onSetMode, onClear }) {
  const panel = document.createElement('div');
  panel.className = 'category-filter-panel';
  panel.style.cssText = STYLES.panel;

  // Header row with title and close button
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

  const heading = document.createElement('p');
  heading.style.cssText = STYLES.heading;
  heading.style.margin = '0';
  heading.textContent = 'Filter by Category';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close filter panel');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'background:none;border:none;color:#8888aa;cursor:pointer;font-size:16px;line-height:1;padding:0;';
  closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });

  headerRow.appendChild(heading);
  headerRow.appendChild(closeBtn);
  panel.appendChild(headerRow);

  // OR / AND mode toggle
  const modeBar = document.createElement('div');
  modeBar.style.cssText = STYLES.modeBar;

  const orBtn = document.createElement('button');
  orBtn.textContent = 'OR';
  orBtn.style.cssText = STYLES.modeBtnActive;
  orBtn.addEventListener('click', () => onSetMode('OR'));

  const andBtn = document.createElement('button');
  andBtn.textContent = 'AND';
  andBtn.style.cssText = STYLES.modeBtn;
  andBtn.addEventListener('click', () => onSetMode('AND'));

  modeBar.appendChild(orBtn);
  modeBar.appendChild(andBtn);
  panel.appendChild(modeBar);

  // Category checkboxes container
  const checkboxList = document.createElement('div');
  panel.appendChild(checkboxList);

  // Clear all button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear all';
  clearBtn.style.cssText = STYLES.clearBtn;
  clearBtn.addEventListener('click', () => onClear());
  panel.appendChild(clearBtn);

  container.appendChild(panel);

  let currentCategories = [];
  let currentSelected = [];

  function renderCheckboxes() {
    checkboxList.innerHTML = '';
    for (const cat of currentCategories) {
      const row = document.createElement('label');
      row.style.cssText = STYLES.row;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = currentSelected.includes(cat);
      checkbox.style.cursor = 'pointer';
      checkbox.addEventListener('change', () => onToggle(cat));

      const label = document.createElement('span');
      label.textContent = cat;

      row.appendChild(checkbox);
      row.appendChild(label);
      checkboxList.appendChild(row);
    }
  }

  function setCategories(categories) {
    currentCategories = categories;
    renderCheckboxes();
    if (categories.length === 0) {
      panel.style.display = 'none';
    }
  }

  function setSelected(selected) {
    currentSelected = selected;
    renderCheckboxes();
  }

  function setMode(mode) {
    orBtn.style.cssText = mode === 'OR' ? STYLES.modeBtnActive : STYLES.modeBtn;
    andBtn.style.cssText = mode === 'AND' ? STYLES.modeBtnActive : STYLES.modeBtn;
  }

  function show() {
    if (currentCategories.length > 0) {
      panel.style.display = 'block';
    }
  }

  function hide() {
    panel.style.display = 'none';
  }

  function isVisible() {
    return panel.style.display !== 'none';
  }

  function destroy() {
    container.removeChild(panel);
  }

  return { show, hide, isVisible, setCategories, setSelected, setMode, destroy, element: panel };
}

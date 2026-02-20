import { EXAMPLES } from '../data/examples.js';

const TABS = [
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'timescales', label: 'Timescales' },
  { id: 'data', label: 'Loading Data' },
  { id: 'examples', label: 'Examples' },
];

const SHORTCUTS_CONTENT = `
  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Keyboard Shortcuts
  </h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tbody>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 16px 8px 0; font-family: monospace; color: #8a8aaa;">
          <kbd style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; border: 1px solid #4a4a6a;">Home</kbd>
          <span style="margin: 0 4px; color: #6a6a8a;">or</span>
          <kbd style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; border: 1px solid #4a4a6a;">h</kbd>
        </td>
        <td style="padding: 8px 0;">Jump to today</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 16px 8px 0; font-family: monospace; color: #8a8aaa;">
          <kbd style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; border: 1px solid #4a4a6a;">/</kbd>
        </td>
        <td style="padding: 8px 0;">Open search</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 16px 8px 0; font-family: monospace; color: #8a8aaa;">
          <kbd style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; border: 1px solid #4a4a6a;">?</kbd>
        </td>
        <td style="padding: 8px 0;">Toggle help menu</td>
      </tr>
      <tr>
        <td style="padding: 8px 16px 8px 0; font-family: monospace; color: #8a8aaa;">
          <kbd style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; border: 1px solid #4a4a6a;">Esc</kbd>
        </td>
        <td style="padding: 8px 0;">Close dialogs</td>
      </tr>
    </tbody>
  </table>

  <h2 style="margin: 24px 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Mouse & Keyboard Navigation
  </h2>
  <ul style="margin: 0; padding: 0 0 0 20px; line-height: 1.8;">
    <li><strong>Pan:</strong> Click and drag to move through time</li>
    <li><strong>Zoom:</strong> Scroll to zoom in/out at cursor position</li>
    <li><strong>Select:</strong> Click on event to select, Ctrl+click to multi-select</li>
  </ul>

  <h2 style="margin: 24px 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Touch Gestures
  </h2>
  <ul style="margin: 0; padding: 0 0 0 20px; line-height: 1.8;">
    <li><strong>Pan:</strong> Touch and drag to move through time</li>
    <li><strong>Pinch-to-Zoom:</strong> Use two fingers to zoom in/out</li>
    <li><strong>Double-Tap:</strong> Quickly tap twice to zoom in</li>
    <li><strong>Tap:</strong> Tap on event to select it</li>
    <li><strong>Long Press:</strong> Press and hold for context menu (if enabled)</li>
  </ul>
`;

const TIMESCALES_CONTENT = `
  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Search Formats
  </h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tbody>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 12px 8px 0; color: #8a8aaa; white-space: nowrap;">Named events</td>
        <td style="padding: 8px 0;">
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">big bang</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">earth</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">now</code>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 12px 8px 0; color: #8a8aaa; white-space: nowrap;">Gigayears</td>
        <td style="padding: 8px 0;">
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">4.5 Ga</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">13.8 Ga</code>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 12px 8px 0; color: #8a8aaa; white-space: nowrap;">Megayears</td>
        <td style="padding: 8px 0;">
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">100 Ma</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">65.5 Ma</code>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 8px 12px 8px 0; color: #8a8aaa; white-space: nowrap;">Years</td>
        <td style="padding: 8px 0;">
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">2024</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">-500</code>
          <span style="color: #6a6a8a; font-size: 12px; margin-left: 4px;">(BCE)</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px 8px 0; color: #8a8aaa; white-space: nowrap;">Dates</td>
        <td style="padding: 8px 0;">
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">2024-06-15</code>
          <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">Jan 2024</code>
        </td>
      </tr>
    </tbody>
  </table>

  <h2 style="margin: 24px 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Display Units
  </h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tbody>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa; width: 60px;">Ga</td>
        <td style="padding: 6px 0;">Gigayears (billions of years)</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa;">Ma</td>
        <td style="padding: 6px 0;">Megayears (millions of years)</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa;">ky</td>
        <td style="padding: 6px 0;">Kiloyears (thousands of years)</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa;">y</td>
        <td style="padding: 6px 0;">Years</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa;">d</td>
        <td style="padding: 6px 0;">Days</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #8a8aaa;">h/m/s</td>
        <td style="padding: 6px 0;">Hours, minutes, seconds</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 20px 0 0 0; color: #8a8aaa; font-size: 13px; line-height: 1.6;">
    The timeline spans from the Big Bang (~13.8 Ga) to the present, with automatic unit scaling based on zoom level.
  </p>
`;

const DATA_CONTENT = `
  <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
    Loading Data
  </h2>

  <h3 style="margin: 0 0 12px 0; color: #c0c0d0; font-size: 16px; font-weight: 500;">
    URL Parameter
  </h3>
  <p style="margin: 0 0 12px 0; color: #a0a0b0; font-size: 14px; line-height: 1.6;">
    Load a built-in example by adding <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px;">?example=name</code> to the URL:
  </p>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
    <tbody>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #00d9ff;">space-exploration</td>
        <td style="padding: 6px 0; color: #a0a0b0;">Sputnik to JWST (default)</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #00d9ff;">earth-history</td>
        <td style="padding: 6px 0; color: #a0a0b0;">Big Bang to humans</td>
      </tr>
      <tr style="border-bottom: 1px solid #3a3a4e;">
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #00d9ff;">ancient-civilizations</td>
        <td style="padding: 6px 0; color: #a0a0b0;">Great empires throughout history</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px 6px 0; font-family: monospace; color: #00d9ff;">wikidata-wars</td>
        <td style="padding: 6px 0; color: #a0a0b0;">Historical conflicts from Wikidata</td>
      </tr>
    </tbody>
  </table>

  <h3 style="margin: 0 0 12px 0; color: #c0c0d0; font-size: 16px; font-weight: 500;">
    Custom Data
  </h3>
  <p style="margin: 0 0 12px 0; color: #a0a0b0; font-size: 14px; line-height: 1.6;">
    Create a JSON file with an array of events:
  </p>
  <pre style="background: #1a1a2e; padding: 12px; border-radius: 6px; font-size: 12px; overflow-x: auto; margin: 0 0 20px 0; border: 1px solid #3a3a4e;"><code style="color: #e0e0e0;">[{
  "id": "apollo-11",
  "label": "Moon Landing",
  "start": "1969-07-20",
  "end": "1969-07-24"
}]</code></pre>

  <p style="margin: 0; color: #6a6a8a; font-size: 13px; line-height: 1.6;">
    See the <a href="https://github.com/charly-vibes/nayra#data-format" target="_blank" style="color: #00d9ff; text-decoration: none;">README</a> for full schema documentation including geological timescales (Ma, Ga) and Wikidata integration.
  </p>
`;

function buildExamplesContent() {
  const exampleItems = EXAMPLES.map(
    (ex) => `
    <li data-example="${ex.id}" style="
      padding: 12px 16px;
      border-bottom: 1px solid #3a3a4e;
      cursor: pointer;
      transition: background 0.15s;
    ">
      <div style="color: #ffffff; font-weight: 500; margin-bottom: 4px;">${ex.label}</div>
      <div style="color: #8a8aaa; font-size: 13px;">${ex.desc}</div>
    </li>
  `
  ).join('');

  return `
    <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
      Load Example Dataset
    </h2>
    <ul style="list-style: none; margin: 0; padding: 0; border: 1px solid #3a3a4e; border-radius: 6px;">
      ${exampleItems}
    </ul>
    <button data-file-picker style="
      margin-top: 20px;
      width: 100%;
      padding: 12px 16px;
      background: #1a1a2e;
      border: 1px solid #4a4a6a;
      border-radius: 6px;
      color: #00d9ff;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    ">Load from file...</button>
  `;
}

export function createHelpMenu(container, options = {}) {
  const { onLoad } = options;
  let activeTab = 'shortcuts';

  const element = document.createElement('div');
  element.className = 'help-menu-overlay';
  element.style.position = 'fixed';
  element.style.top = '0';
  element.style.left = '0';
  element.style.right = '0';
  element.style.bottom = '0';
  element.style.background = 'rgba(0, 0, 0, 0.7)';
  element.style.zIndex = '1000';
  element.style.display = 'none';
  element.style.justifyContent = 'center';
  element.style.alignItems = 'center';

  const content = document.createElement('div');
  content.className = 'help-content';
  content.style.cssText = `
    background: #2a2a3e;
    border: 1px solid #4a4a6a;
    border-radius: 12px;
    padding: 0;
    max-width: 520px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
  `;

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'help-tabs';
  tabBar.style.cssText = `
    display: flex;
    border-bottom: 1px solid #4a4a6a;
    background: #232336;
    border-radius: 12px 12px 0 0;
  `;

  const tabButtons = {};

  TABS.forEach((tab, index) => {
    const button = document.createElement('button');
    button.className = 'help-tab';
    button.dataset.tab = tab.id;
    button.textContent = tab.label;
    button.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: #8a8aaa;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
      border-radius: ${index === 0 ? '12px 0 0 0' : index === TABS.length - 1 ? '0 12px 0 0' : '0'};
    `;

    button.addEventListener('click', () => switchTab(tab.id));
    button.addEventListener('mouseenter', () => {
      if (activeTab !== tab.id) {
        button.style.color = '#c0c0d0';
      }
    });
    button.addEventListener('mouseleave', () => {
      if (activeTab !== tab.id) {
        button.style.color = '#8a8aaa';
      }
    });

    tabBar.appendChild(button);
    tabButtons[tab.id] = button;
  });

  // Content panels
  const panelContainer = document.createElement('div');
  panelContainer.style.cssText = `
    padding: 24px 32px;
    overflow-y: auto;
    flex: 1;
  `;

  const panels = {};

  TABS.forEach((tab) => {
    const panel = document.createElement('div');
    panel.className = 'help-panel';
    panel.dataset.panel = tab.id;
    panel.style.display = 'none';

    if (tab.id === 'shortcuts') {
      panel.innerHTML = SHORTCUTS_CONTENT;
    } else if (tab.id === 'timescales') {
      panel.innerHTML = TIMESCALES_CONTENT;
    } else if (tab.id === 'data') {
      panel.innerHTML = DATA_CONTENT;
    } else if (tab.id === 'examples') {
      panel.innerHTML = buildExamplesContent();
      setupExamplesPanel(panel);
    }

    panelContainer.appendChild(panel);
    panels[tab.id] = panel;
  });

  function setupExamplesPanel(panel) {
    panel.querySelectorAll('[data-example]').forEach((li) => {
      li.addEventListener('mouseenter', () => {
        li.style.background = '#3a3a4e';
      });
      li.addEventListener('mouseleave', () => {
        li.style.background = 'transparent';
      });
      li.addEventListener('click', () => {
        if (onLoad) {
          onLoad(li.dataset.example);
        }
        hide();
      });
    });

    const filePickerBtn = panel.querySelector('[data-file-picker]');
    if (filePickerBtn) {
      filePickerBtn.addEventListener('mouseenter', () => {
        filePickerBtn.style.background = '#2a2a3e';
        filePickerBtn.style.borderColor = '#00d9ff';
      });
      filePickerBtn.addEventListener('mouseleave', () => {
        filePickerBtn.style.background = '#1a1a2e';
        filePickerBtn.style.borderColor = '#4a4a6a';
      });
      filePickerBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = () => {
          if (input.files[0] && onLoad) {
            onLoad(input.files[0]);
          }
          hide();
        };
        input.click();
      });
    }
  }

  // Footer
  const footer = document.createElement('p');
  footer.style.cssText = `
    margin: 0;
    padding: 12px 24px;
    color: #6a6a8a;
    font-size: 12px;
    text-align: center;
    border-top: 1px solid #3a3a4e;
    background: #232336;
  `;
  footer.innerHTML = `
    <kbd style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; border: 1px solid #4a4a6a;">←</kbd>
    <kbd style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; border: 1px solid #4a4a6a; margin-left: 2px;">→</kbd>
    <span style="margin: 0 8px;">switch tabs</span>
    <kbd style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; border: 1px solid #4a4a6a;">Esc</kbd>
    <span style="margin-left: 4px;">close</span>
  `;

  content.appendChild(tabBar);
  content.appendChild(panelContainer);
  content.appendChild(footer);

  function switchTab(tabId) {
    activeTab = tabId;

    // Update tab button styles
    Object.entries(tabButtons).forEach(([id, btn]) => {
      if (id === tabId) {
        btn.style.color = '#ffffff';
        btn.style.background = '#2a2a3e';
      } else {
        btn.style.color = '#8a8aaa';
        btn.style.background = 'transparent';
      }
    });

    // Update panel visibility
    Object.entries(panels).forEach(([id, panel]) => {
      panel.style.display = id === tabId ? 'block' : 'none';
    });
  }

  // Initialize first tab
  switchTab('shortcuts');

  // Prevent clicks on content from closing the modal
  content.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Click on backdrop closes the modal
  element.addEventListener('click', () => {
    hide();
  });

  element.appendChild(content);
  container.appendChild(element);

  function onKeyDown(e) {
    if (!isVisible()) return;

    if (e.key === 'Escape' || e.key === '?') {
      e.preventDefault();
      hide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let newIndex;
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
      }
      switchTab(TABS[newIndex].id);
    }
  }

  document.addEventListener('keydown', onKeyDown);

  function show() {
    element.style.display = 'flex';
  }

  function hide() {
    element.style.display = 'none';
  }

  function isVisible() {
    return element.style.display !== 'none';
  }

  function getActiveTab() {
    return activeTab;
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    container.removeChild(element);
  }

  return {
    element,
    show,
    hide,
    isVisible,
    getActiveTab,
    switchTab,
    destroy,
  };
}

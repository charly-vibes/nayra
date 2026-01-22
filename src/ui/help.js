const TABS = [
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'timescales', label: 'Timescales' },
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
    Navigation
  </h2>
  <ul style="margin: 0; padding: 0 0 0 20px; line-height: 1.8;">
    <li><strong>Pan:</strong> Click and drag to move through time</li>
    <li><strong>Zoom:</strong> Scroll to zoom in/out at cursor position</li>
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

export function createHelpMenu(container) {
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
      border-radius: ${index === 0 ? '12px 0 0 0' : '0 12px 0 0'};
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
    }

    panelContainer.appendChild(panel);
    panels[tab.id] = panel;
  });

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

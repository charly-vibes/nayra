export function createHelpMenu(container) {
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
    padding: 24px 32px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  content.innerHTML = `
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

    <p style="margin: 24px 0 0 0; color: #8a8aaa; font-size: 13px; text-align: center;">
      Press <kbd style="background: #1a1a2e; padding: 2px 6px; border-radius: 3px; border: 1px solid #4a4a6a; font-size: 12px;">Esc</kbd> or click outside to close
    </p>
  `;

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

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    container.removeChild(element);
  }

  return {
    element,
    show,
    hide,
    isVisible,
    destroy,
  };
}

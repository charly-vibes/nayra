import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('HelpMenu', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('createHelpMenu', () => {
    it('creates a hidden help menu element', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);

      expect(helpMenu.element).toBeDefined();
      expect(helpMenu.element.style.display).toBe('none');
    });

    it('has proper modal structure with backdrop', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);

      expect(helpMenu.element.className).toBe('help-menu-overlay');
    });
  });

  describe('content', () => {
    it('displays keyboard shortcuts', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      const content = helpMenu.element.textContent;
      expect(content).toContain('Home');
      expect(content).toContain('h');
      expect(content).toContain('/');
      expect(content).toContain('?');
    });

    it('displays navigation instructions', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      const content = helpMenu.element.textContent;
      expect(content).toMatch(/pan|drag/i);
      expect(content).toMatch(/zoom|scroll/i);
    });
  });

  describe('show/hide', () => {
    it('show() makes the help menu visible', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      expect(helpMenu.element.style.display).not.toBe('none');
    });

    it('hide() hides the help menu', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();
      helpMenu.hide();

      expect(helpMenu.element.style.display).toBe('none');
    });

    it('isVisible() returns correct state', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);

      expect(helpMenu.isVisible()).toBe(false);
      helpMenu.show();
      expect(helpMenu.isVisible()).toBe(true);
      helpMenu.hide();
      expect(helpMenu.isVisible()).toBe(false);
    });
  });

  describe('keyboard interaction', () => {
    it('Escape key hides the menu', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(helpMenu.element.style.display).toBe('none');
    });

    it('? key hides the menu when visible', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));

      expect(helpMenu.element.style.display).toBe('none');
    });
  });

  describe('click to dismiss', () => {
    it('clicking backdrop hides the menu', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      // Click on the backdrop (outer element)
      helpMenu.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(helpMenu.element.style.display).toBe('none');
    });

    it('clicking content does not hide the menu', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();

      // Click on the content area
      const content = helpMenu.element.querySelector('.help-content');
      content.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(helpMenu.element.style.display).not.toBe('none');
    });
  });

  describe('destroy', () => {
    it('removes the element from DOM', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      const element = helpMenu.element;

      helpMenu.destroy();

      expect(container.contains(element)).toBe(false);
    });

    it('removes event listeners', async () => {
      const { createHelpMenu } = await import('../../src/ui/help.js');

      const helpMenu = createHelpMenu(container);
      helpMenu.show();
      helpMenu.destroy();

      // This should not throw or affect anything
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
  });
});

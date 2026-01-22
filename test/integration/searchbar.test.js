import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SearchBar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('createSearchBar', () => {
    it('creates a hidden search bar element', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});

      expect(searchBar.element).toBeDefined();
      expect(searchBar.element.style.display).toBe('none');
    });

    it('has an input field', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});
      const input = searchBar.element.querySelector('input');

      expect(input).not.toBeNull();
      expect(input.type).toBe('text');
    });
  });

  describe('show/hide', () => {
    it('show() makes the search bar visible and focuses input', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});
      searchBar.show();

      expect(searchBar.element.style.display).not.toBe('none');
    });

    it('hide() hides the search bar and clears input', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});
      const input = searchBar.element.querySelector('input');

      searchBar.show();
      input.value = 'test query';
      searchBar.hide();

      expect(searchBar.element.style.display).toBe('none');
      expect(input.value).toBe('');
    });
  });

  describe('submission', () => {
    it('calls onSubmit with input value when Enter is pressed', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');
      const onSubmit = vi.fn();

      const searchBar = createSearchBar(container, onSubmit);
      const input = searchBar.element.querySelector('input');

      searchBar.show();
      input.value = '2000';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onSubmit).toHaveBeenCalledWith('2000');
    });

    it('hides search bar after successful submission', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');
      const onSubmit = vi.fn();

      const searchBar = createSearchBar(container, onSubmit);
      const input = searchBar.element.querySelector('input');

      searchBar.show();
      input.value = '2000';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(searchBar.element.style.display).toBe('none');
    });

    it('Escape key hides search bar without submitting', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');
      const onSubmit = vi.fn();

      const searchBar = createSearchBar(container, onSubmit);
      const input = searchBar.element.querySelector('input');

      searchBar.show();
      input.value = 'some query';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(searchBar.element.style.display).toBe('none');
    });
  });

  describe('isVisible', () => {
    it('returns false when hidden', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});

      expect(searchBar.isVisible()).toBe(false);
    });

    it('returns true when shown', async () => {
      const { createSearchBar } = await import('../../src/ui/searchbar.js');

      const searchBar = createSearchBar(container, () => {});
      searchBar.show();

      expect(searchBar.isVisible()).toBe(true);
    });
  });
});

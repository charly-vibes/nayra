import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDropzone } from '../../src/ui/dropzone.js';

describe('dropzone', () => {
  let container;
  let dropzone;
  let onLoad;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onLoad = vi.fn();
  });

  afterEach(() => {
    if (dropzone?.destroy) {
      dropzone.destroy();
    }
    container.remove();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('creates dropzone without visible overlay initially', () => {
      dropzone = createDropzone(container, { onLoad });

      const overlay = container.querySelector('.nayra-dropzone-overlay');
      expect(overlay).toBeTruthy();
      expect(getComputedStyle(overlay).display).not.toBe('flex');
    });

    it('adds drag event listeners to container', () => {
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
      dropzone = createDropzone(container, { onLoad });

      expect(addEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });
  });

  describe('drag events', () => {
    it('shows overlay on dragenter', () => {
      dropzone = createDropzone(container, { onLoad });
      const overlay = container.querySelector('.nayra-dropzone-overlay');

      const dragenterEvent = new Event('dragenter');
      container.dispatchEvent(dragenterEvent);

      expect(overlay.style.display).toBe('flex');
    });

    it('hides overlay on dragleave when leaving container', () => {
      dropzone = createDropzone(container, { onLoad });
      const overlay = container.querySelector('.nayra-dropzone-overlay');

      container.dispatchEvent(new Event('dragenter'));
      expect(overlay.style.display).toBe('flex');

      const dragleaveEvent = new Event('dragleave');
      Object.defineProperty(dragleaveEvent, 'relatedTarget', { value: null });
      container.dispatchEvent(dragleaveEvent);

      expect(overlay.style.display).toBe('none');
    });

    it('prevents default on dragover', () => {
      dropzone = createDropzone(container, { onLoad });

      const dragoverEvent = new Event('dragover', { cancelable: true });
      container.dispatchEvent(dragoverEvent);

      expect(dragoverEvent.defaultPrevented).toBe(true);
    });
  });

  describe('drop handling', () => {
    it('calls onLoad with dropped file', async () => {
      dropzone = createDropzone(container, { onLoad });
      const overlay = container.querySelector('.nayra-dropzone-overlay');

      container.dispatchEvent(new Event('dragenter'));

      const mockFile = new File(['[]'], 'events.json', { type: 'application/json' });
      const dropEvent = new Event('drop', { cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [mockFile] },
      });
      container.dispatchEvent(dropEvent);

      expect(dropEvent.defaultPrevented).toBe(true);
      expect(overlay.style.display).toBe('none');
      expect(onLoad).toHaveBeenCalledWith(mockFile);
    });

    it('accepts .json files', async () => {
      dropzone = createDropzone(container, { onLoad });

      const mockFile = new File(['[]'], 'data.json', { type: 'application/json' });
      const dropEvent = new Event('drop', { cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [mockFile] },
      });
      container.dispatchEvent(dropEvent);

      expect(onLoad).toHaveBeenCalledWith(mockFile);
    });

    it('attempts to load non-.json files with warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      dropzone = createDropzone(container, { onLoad });

      const mockFile = new File(['[]'], 'data.txt', { type: 'text/plain' });
      const dropEvent = new Event('drop', { cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [mockFile] },
      });
      container.dispatchEvent(dropEvent);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not a .json'));
      expect(onLoad).toHaveBeenCalledWith(mockFile);
    });

    it('ignores drop with no files', () => {
      dropzone = createDropzone(container, { onLoad });

      const dropEvent = new Event('drop', { cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [] },
      });
      container.dispatchEvent(dropEvent);

      expect(onLoad).not.toHaveBeenCalled();
    });
  });

  describe('overlay styling', () => {
    it('displays drop message in overlay', () => {
      dropzone = createDropzone(container, { onLoad });
      const overlay = container.querySelector('.nayra-dropzone-overlay');

      expect(overlay.textContent).toContain('Drop JSON file to load');
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
      dropzone = createDropzone(container, { onLoad });
      dropzone.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragenter', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    it('removes overlay element on destroy', () => {
      dropzone = createDropzone(container, { onLoad });
      dropzone.destroy();

      const overlay = container.querySelector('.nayra-dropzone-overlay');
      expect(overlay).toBeNull();
    });
  });
});

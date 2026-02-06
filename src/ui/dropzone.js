export function createDropzone(container, { onLoad }) {
  const overlay = document.createElement('div');
  overlay.className = 'nayra-dropzone-overlay';
  overlay.style.cssText = `
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 24px;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 1000;
  `;
  overlay.textContent = 'Drop JSON file to load';
  container.appendChild(overlay);

  let dragCounter = 0;

  function handleDragenter(e) {
    e.preventDefault();
    dragCounter++;
    overlay.style.display = 'flex';
  }

  function handleDragover(e) {
    e.preventDefault();
  }

  function handleDragleave(e) {
    dragCounter--;
    if (dragCounter === 0 || e.relatedTarget === null) {
      overlay.style.display = 'none';
      dragCounter = 0;
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    overlay.style.display = 'none';
    dragCounter = 0;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!file.name.endsWith('.json')) {
      console.warn(`File "${file.name}" is not a .json file, attempting to parse anyway`);
    }

    onLoad(file);
  }

  container.addEventListener('dragenter', handleDragenter);
  container.addEventListener('dragover', handleDragover);
  container.addEventListener('dragleave', handleDragleave);
  container.addEventListener('drop', handleDrop);

  return {
    destroy() {
      container.removeEventListener('dragenter', handleDragenter);
      container.removeEventListener('dragover', handleDragover);
      container.removeEventListener('dragleave', handleDragleave);
      container.removeEventListener('drop', handleDrop);
      overlay.remove();
    },
  };
}

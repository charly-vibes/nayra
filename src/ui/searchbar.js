export function createSearchBar(container, onSubmit) {
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

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      if (value) {
        onSubmit(value);
      }
      hide();
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
    element.style.display = 'none';
    input.value = '';
  }

  function isVisible() {
    return element.style.display !== 'none';
  }

  function destroy() {
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

export function createHelpButton(container, { onToggleHelp }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Help');
  button.textContent = '?';

  button.style.position = 'fixed';
  button.style.bottom = 'env(safe-area-inset-bottom, 16px)';
  button.style.right = 'env(safe-area-inset-right, 16px)';
  button.style.width = '48px';
  button.style.height = '48px';
  button.style.borderRadius = '50%';
  button.style.border = '1px solid #4a4a6a';
  button.style.background = '#2a2a3e';
  button.style.color = '#00d9ff';
  button.style.fontSize = '20px';
  button.style.fontWeight = '700';
  button.style.cursor = 'pointer';
  button.style.zIndex = '900';
  button.style.touchAction = 'manipulation';
  button.style.webkitTapHighlightColor = 'transparent';
  button.style.transition = 'transform 0.1s ease';

  button.addEventListener('click', onToggleHelp);

  button.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    button.style.transform = 'scale(0.92)';
  });

  button.addEventListener('pointerup', () => {
    button.style.transform = 'scale(1)';
  });

  container.appendChild(button);

  function destroy() {
    button.removeEventListener('click', onToggleHelp);
    container.removeChild(button);
  }

  return { element: button, destroy };
}

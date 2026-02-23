export function createZoomControls(container, { onZoomIn, onZoomOut, onFitToContent, onResetZoom, onToggleFilter }) {
  const controlsContainer = document.createElement('div');
  controlsContainer.setAttribute('aria-label', 'Zoom controls');
  controlsContainer.style.position = 'fixed';
  controlsContainer.style.bottom = 'env(safe-area-inset-bottom, 16px)';
  controlsContainer.style.left = 'env(safe-area-inset-left, 16px)';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.flexDirection = 'column';
  controlsContainer.style.gap = '8px';
  controlsContainer.style.zIndex = '900';

  const buttonStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: '1px solid #4a4a6a',
    background: '#2a2a3e',
    color: '#e0e0e0',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    touchAction: 'manipulation',
    webkitTapHighlightColor: 'transparent',
    transition: 'transform 0.1s ease, background 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Zoom In button
  const zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.setAttribute('aria-label', 'Zoom in');
  zoomInBtn.setAttribute('title', 'Zoom in (+)');
  zoomInBtn.textContent = '+';
  Object.assign(zoomInBtn.style, buttonStyle);

  // Zoom Out button
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.setAttribute('aria-label', 'Zoom out');
  zoomOutBtn.setAttribute('title', 'Zoom out (-)');
  zoomOutBtn.textContent = '−'; // Using minus sign (U+2212) instead of hyphen
  Object.assign(zoomOutBtn.style, buttonStyle);

  // Separator
  const separator = document.createElement('div');
  separator.style.height = '1px';
  separator.style.background = '#4a4a6a';
  separator.style.margin = '4px 8px';

  // Fit to Content button
  const fitBtn = document.createElement('button');
  fitBtn.type = 'button';
  fitBtn.setAttribute('aria-label', 'Fit all events in view');
  fitBtn.setAttribute('title', 'Fit to content (0)');
  fitBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" stroke-width="2"/>
    <path d="M7 7L9 9M13 7L11 9M7 13L9 11M13 13L11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  Object.assign(fitBtn.style, buttonStyle);

  // Reset Zoom button
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.setAttribute('aria-label', 'Reset zoom to default');
  resetBtn.setAttribute('title', 'Reset zoom (1)');
  resetBtn.textContent = '1:1';
  resetBtn.style.fontSize = '12px';
  Object.assign(resetBtn.style, buttonStyle);

  // Separator before filter
  const separator2 = document.createElement('div');
  separator2.style.height = '1px';
  separator2.style.background = '#4a4a6a';
  separator2.style.margin = '4px 8px';

  // Filter toggle button
  const filterBtn = document.createElement('button');
  filterBtn.type = 'button';
  filterBtn.setAttribute('aria-label', 'Toggle category filter');
  filterBtn.setAttribute('title', 'Filter by category (f)');
  filterBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4h14M5 9h8M8 14h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  Object.assign(filterBtn.style, buttonStyle);

  // Add hover effects
  const buttons = [zoomInBtn, zoomOutBtn, fitBtn, resetBtn, filterBtn];
  buttons.forEach(btn => {
    btn.addEventListener('pointerenter', () => {
      btn.style.background = '#3a3a4e';
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.background = '#2a2a3e';
    });
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      btn.style.transform = 'scale(0.92)';
    });
    btn.addEventListener('pointerup', () => {
      btn.style.transform = 'scale(1)';
    });
  });

  // Event handlers
  zoomInBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onZoomIn();
  });

  zoomOutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onZoomOut();
  });

  fitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onFitToContent();
  });

  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onResetZoom();
  });

  if (onToggleFilter) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleFilter();
    });
  }

  // Assemble controls
  controlsContainer.appendChild(zoomInBtn);
  controlsContainer.appendChild(zoomOutBtn);
  controlsContainer.appendChild(separator);
  controlsContainer.appendChild(fitBtn);
  controlsContainer.appendChild(resetBtn);
  if (onToggleFilter) {
    controlsContainer.appendChild(separator2);
    controlsContainer.appendChild(filterBtn);
  }
  container.appendChild(controlsContainer);

  function setFilterActive(active) {
    filterBtn.style.background = active ? '#4a4a8a' : '#2a2a3e';
    filterBtn.style.borderColor = active ? '#6a6aaa' : '#4a4a6a';
  }

  function destroy() {
    zoomInBtn.removeEventListener('click', onZoomIn);
    zoomOutBtn.removeEventListener('click', onZoomOut);
    fitBtn.removeEventListener('click', onFitToContent);
    resetBtn.removeEventListener('click', onResetZoom);
    container.removeChild(controlsContainer);
  }

  return { element: controlsContainer, setFilterActive, destroy };
}

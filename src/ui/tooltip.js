import { formatTimeRange } from './format.js';

const OFFSET_X = 10;
const OFFSET_Y = 10;
const MIN_MARGIN = 10;

export function createTooltip(container) {
  const element = document.createElement('div');
  element.className = 'tooltip';
  element.style.position = 'fixed';
  element.style.zIndex = '1001';
  element.style.background = '#2a2a3e';
  element.style.border = '1px solid #4a4a6a';
  element.style.borderRadius = '6px';
  element.style.padding = '8px 12px';
  element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.4)';
  element.style.color = '#ffffff';
  element.style.fontSize = '13px';
  element.style.fontFamily = 'system-ui, sans-serif';
  element.style.pointerEvents = 'none';
  element.style.display = 'none';
  element.style.maxWidth = '300px';
  element.style.whiteSpace = 'nowrap';

  const labelEl = document.createElement('div');
  labelEl.style.fontWeight = '500';
  labelEl.style.marginBottom = '2px';

  const timeEl = document.createElement('div');
  timeEl.style.color = '#8a8aaa';
  timeEl.style.fontSize = '12px';

  element.appendChild(labelEl);
  element.appendChild(timeEl);
  container.appendChild(element);

  function show() {
    element.style.display = 'block';
  }

  function hide() {
    element.style.display = 'none';
  }

  function isVisible() {
    return element.style.display !== 'none';
  }

  function update(event, x, y) {
    labelEl.textContent = event.label || 'Untitled';
    timeEl.textContent = formatTimeRange(event);

    let left = x + OFFSET_X;
    let top = y + OFFSET_Y;

    const tooltipWidth = 200;
    const tooltipHeight = 50;

    if (left + tooltipWidth > window.innerWidth - MIN_MARGIN) {
      left = window.innerWidth - tooltipWidth - MIN_MARGIN;
    }

    if (top + tooltipHeight > window.innerHeight - MIN_MARGIN) {
      top = window.innerHeight - tooltipHeight - MIN_MARGIN;
    }

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  function destroy() {
    container.removeChild(element);
  }

  return {
    element,
    show,
    hide,
    isVisible,
    update,
    destroy,
  };
}

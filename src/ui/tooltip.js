import { formatTimeRange } from './format.js';

const OFFSET_X = 10;
const OFFSET_Y = 10;
const MIN_MARGIN = 10;
const MAX_CLUSTER_EVENTS = 6;

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

  const listEl = document.createElement('div');
  listEl.style.marginTop = '8px';
  listEl.style.display = 'none';
  listEl.style.whiteSpace = 'normal';
  listEl.style.lineHeight = '1.4';

  element.appendChild(labelEl);
  element.appendChild(timeEl);
  element.appendChild(listEl);
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

  function measureTooltip(target) {
    const previousDisplay = element.style.display;
    const previousVisibility = element.style.visibility;
    const previousLeft = element.style.left;
    const previousTop = element.style.top;

    element.style.visibility = 'hidden';
    element.style.display = 'block';
    element.style.left = '-9999px';
    element.style.top = '-9999px';

    const width = Math.max(element.offsetWidth, target.__cluster ? 260 : 200);
    const height = Math.max(element.offsetHeight, target.__cluster ? 120 : 50);

    element.style.display = previousDisplay;
    element.style.visibility = previousVisibility;
    element.style.left = previousLeft;
    element.style.top = previousTop;

    return { width, height };
  }

  function update(target, x, y, calendar) {
    if (target.__cluster) {
      const events = [...target.events].sort((a, b) => {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        return a.id.localeCompare(b.id);
      });

      labelEl.textContent = `${target.count} events`;
      timeEl.textContent = formatTimeRange({ start: target.minTime, end: target.maxTime }, calendar);
      listEl.replaceChildren();
      listEl.style.display = 'block';

      const displayedEvents = events.slice(0, MAX_CLUSTER_EVENTS);
      for (const event of displayedEvents) {
        const itemEl = document.createElement('div');
        itemEl.textContent = `${event.label || 'Untitled'} • ${formatTimeRange(event, calendar)}`;
        listEl.appendChild(itemEl);
      }

      if (events.length > displayedEvents.length) {
        const moreEl = document.createElement('div');
        moreEl.textContent = `+${events.length - displayedEvents.length} more`;
        moreEl.style.color = '#8a8aaa';
        listEl.appendChild(moreEl);
      }
    } else {
      labelEl.textContent = target.label || 'Untitled';
      timeEl.textContent = formatTimeRange(target, calendar);
      listEl.replaceChildren();
      listEl.style.display = 'none';
    }

    let left = x + OFFSET_X;
    let top = y + OFFSET_Y;
    const { width: tooltipWidth, height: tooltipHeight } = measureTooltip(target);

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

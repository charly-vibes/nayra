import { formatTimeRange } from './format.js';

export function createEventPanel(container, { onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'event-panel-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0, 0, 0, 0.6)';
  overlay.style.display = 'none';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '1000';

  const panel = document.createElement('div');
  panel.className = 'event-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Event details');
  panel.style.background = '#2a2a3e';
  panel.style.border = '1px solid #4a4a6a';
  panel.style.borderRadius = '8px';
  panel.style.padding = '24px';
  panel.style.maxWidth = '500px';
  panel.style.width = '90%';
  panel.style.maxHeight = '80vh';
  panel.style.overflowY = 'auto';
  panel.style.color = '#ffffff';
  panel.style.fontFamily = 'system-ui, sans-serif';
  panel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';

  const titleEl = document.createElement('h2');
  titleEl.className = 'event-panel-title';
  titleEl.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
  `;

  const timeEl = document.createElement('div');
  timeEl.className = 'event-panel-time';
  timeEl.style.cssText = `
    color: #8a8aaa;
    font-size: 14px;
    margin-bottom: 16px;
  `;

  const descEl = document.createElement('div');
  descEl.className = 'event-panel-description';
  descEl.style.cssText = `
    line-height: 1.6;
    margin-bottom: 16px;
  `;

  const metaEl = document.createElement('div');
  metaEl.className = 'event-panel-meta';
  metaEl.style.cssText = `
    font-size: 13px;
    color: #8a8aaa;
    border-top: 1px solid #3a3a4e;
    padding-top: 16px;
  `;

  panel.appendChild(titleEl);
  panel.appendChild(timeEl);
  panel.appendChild(descEl);
  panel.appendChild(metaEl);
  overlay.appendChild(panel);
  container.appendChild(overlay);

  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  overlay.addEventListener('click', () => {
    hide();
    if (onClose) onClose();
  });

  function onKeyDown(e) {
    if (!isVisible()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      if (onClose) onClose();
    }
  }

  document.addEventListener('keydown', onKeyDown);

  function show() {
    overlay.style.display = 'flex';
  }

  function hide() {
    overlay.style.display = 'none';
  }

  function isVisible() {
    return overlay.style.display !== 'none';
  }

  function update(events) {
    if (!events || events.length === 0) return;

    const event = events[0];

    titleEl.textContent = event.label || 'Untitled';
    timeEl.textContent = formatTimeRange(event);

    if (event.description) {
      descEl.textContent = event.description;
      descEl.style.display = 'block';
    } else {
      descEl.style.display = 'none';
    }

    let metaHtml = '';

    if (event.category) {
      metaHtml += `<div class="event-panel-category" style="margin-bottom: 8px;">
        <strong>Category:</strong> ${escapeHtml(event.category)}
      </div>`;
    }

    if (event.tags && event.tags.length > 0) {
      const tagSpans = event.tags.map(t => 
        `<span style="background: #1a1a2e; padding: 2px 8px; border-radius: 4px; margin-right: 4px;">${escapeHtml(t)}</span>`
      ).join('');
      metaHtml += `<div class="event-panel-tags" style="margin-bottom: 8px;">
        <strong>Tags:</strong> ${tagSpans}
      </div>`;
    }

    if (event.url) {
      metaHtml += `<div class="event-panel-url" style="margin-bottom: 8px;">
        <strong>Link:</strong> <a href="${escapeHtml(event.url)}" target="_blank" rel="noopener" 
          style="color: #6a9fff; text-decoration: none;">${escapeHtml(event.url)}</a>
      </div>`;
    }

    if (event.source) {
      metaHtml += `<div class="event-panel-source" style="margin-bottom: 8px;">
        <strong>Source:</strong> ${escapeHtml(event.source)}
      </div>`;
    }

    metaEl.innerHTML = metaHtml;
    metaEl.style.display = metaHtml ? 'block' : 'none';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    container.removeChild(overlay);
  }

  return {
    element: panel,
    show,
    hide,
    isVisible,
    update,
    destroy,
  };
}

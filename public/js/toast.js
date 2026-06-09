/**
 * Toast - XP-style notification toasts
 * Shows brief pop-up notifications in the top-right corner.
 */
window.Toast = (function () {
  'use strict';

  var container = null;
  var DEFAULT_DURATION = 3000;

  /**
   * Ensure the toast container exists.
   */
  function ensureContainer() {
    if (container) return;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  /**
   * Show a toast notification.
   * @param {Object} opts
   * @param {string} opts.icon   - Emoji icon (e.g. '🎵', '✅', '⚠️')
   * @param {string} opts.title  - Bold title text
   * @param {string} opts.message - Body text (ellipsized if long)
   * @param {number} [opts.duration=3000] - Auto-dismiss time in ms
   */
  function show(opts) {
    ensureContainer();

    var toast = document.createElement('div');
    toast.className = 'xp-toast';

    // Titlebar strip
    var titlebar = document.createElement('div');
    titlebar.className = 'xp-toast-titlebar';
    titlebar.textContent = opts.title || 'Notification';

    // Content area
    var content = document.createElement('div');
    content.className = 'xp-toast-content';

    var iconEl = document.createElement('div');
    iconEl.className = 'xp-toast-icon';
    iconEl.textContent = opts.icon || '💬';

    var body = document.createElement('div');
    body.className = 'xp-toast-body';

    var message = document.createElement('div');
    message.className = 'xp-toast-message';
    message.textContent = opts.message || '';

    body.appendChild(message);
    content.appendChild(iconEl);
    content.appendChild(body);
    toast.appendChild(titlebar);
    toast.appendChild(content);
    container.appendChild(toast);

    // Auto-dismiss
    var duration = opts.duration || DEFAULT_DURATION;
    var timer = setTimeout(function () {
      dismiss(toast);
    }, duration);

    // Click to dismiss early
    toast.addEventListener('click', function () {
      clearTimeout(timer);
      dismiss(toast);
    });
  }

  /**
   * Animate out and remove a toast element.
   */
  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('hiding');
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 300);
  }

  return { show: show, dismiss: dismiss };
})();

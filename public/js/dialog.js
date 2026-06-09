/**
 * Dialog - XP-style dialog system
 * Task 7: Error, info, and URL prompt dialogs with XP styling
 */
window.Dialog = (function () {
  'use strict';

  // Track current dialog overlay so only one is active at a time
  var currentOverlay = null;

  /**
   * Create a modal dialog and return a Promise that resolves with
   * the value of the clicked button.
   *
   * @param {string} title - Dialog title
   * @param {string} bodyHtml - HTML content for the dialog body
   * @param {Array} buttons - Array of {label, value, primary?}
   * @returns {Promise} resolves with button value
   */
  function createDialog(title, bodyHtml, buttons) {
    return new Promise(function (resolve) {
      // Remove any existing dialog
      closeCurrentDialog();

      // Overlay
      var overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';

      // Dialog box
      var dialog = document.createElement('div');
      dialog.className = 'xp-dialog';

      // Titlebar
      var titlebar = document.createElement('div');
      titlebar.className = 'xp-dialog-titlebar';
      titlebar.textContent = title;

      // Body
      var body = document.createElement('div');
      body.className = 'xp-dialog-body';
      body.innerHTML = bodyHtml;

      // Buttons row
      var buttonRow = document.createElement('div');
      buttonRow.className = 'xp-dialog-buttons';

      buttons.forEach(function (btnConfig) {
        var btn = document.createElement('button');
        btn.className = 'xp-dialog-btn';
        if (btnConfig.primary) {
          btn.className += ' xp-dialog-btn-primary';
        }
        btn.textContent = btnConfig.label;
        btn.addEventListener('click', function () {
          resolve(btnConfig.value);
          // Delay DOM cleanup so .then() handlers can still read input values
          setTimeout(cleanup, 0);
        });
        buttonRow.appendChild(btn);
      });

      dialog.appendChild(titlebar);
      dialog.appendChild(body);
      dialog.appendChild(buttonRow);
      overlay.appendChild(dialog);

      // Click outside dialog (on overlay) does nothing — modal behavior
      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) {
          // Focus first button instead of closing
          var firstBtn = buttonRow.querySelector('.xp-dialog-btn-primary') ||
                         buttonRow.querySelector('.xp-dialog-btn');
          if (firstBtn) firstBtn.focus();
        }
      });

      // Escape key closes with last button value (usually Cancel)
      function handleKey(e) {
        if (e.key === 'Escape') {
          var lastBtn = buttons[buttons.length - 1];
          resolve(lastBtn.value);
          setTimeout(cleanup, 0);
        }
      }

      document.addEventListener('keydown', handleKey);

      function cleanup() {
        document.removeEventListener('keydown', handleKey);
        if (overlay.parentNode) {
          overlay.remove();
        }
        if (currentOverlay === overlay) {
          currentOverlay = null;
        }
      }

      currentOverlay = overlay;
      document.body.appendChild(overlay);

      // Auto-focus the primary button or the URL input for promptUrl
      var input = dialog.querySelector('#dialog-url-input');
      if (input) {
        input.focus();
        input.select();
      } else {
        var primaryBtn = buttonRow.querySelector('.xp-dialog-btn-primary') ||
                         buttonRow.querySelector('.xp-dialog-btn');
        if (primaryBtn) primaryBtn.focus();
      }
    });
  }

  /**
   * Close current dialog if one is open.
   */
  function closeCurrentDialog() {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
    }
  }

  /**
   * Show an error dialog with a warning icon.
   * @param {string} title
   * @param {string} message
   * @returns {Promise} resolves 'ok'
   */
  function showError(title, message) {
    var safeMessage = escapeHtml(message);
    var bodyHtml =
      '<div class="xp-dialog-error">⚠️</div>' +
      '<div class="xp-dialog-message">' + safeMessage + '</div>';

    return createDialog(title, bodyHtml, [
      { label: 'OK', value: 'ok', primary: true }
    ]);
  }

  /**
   * Show an info dialog with an info icon.
   * @param {string} title
   * @param {string} message
   * @returns {Promise} resolves 'ok'
   */
  function showInfo(title, message) {
    var safeMessage = escapeHtml(message);
    var bodyHtml =
      '<div class="xp-dialog-info">ℹ️</div>' +
      '<div class="xp-dialog-message">' + safeMessage + '</div>';

    return createDialog(title, bodyHtml, [
      { label: 'OK', value: 'ok', primary: true }
    ]);
  }

  /**
   * Show a URL prompt dialog.
   * @param {string} title
   * @returns {Promise} resolves 'ok' (with URL in #dialog-url-input value) or 'cancel'
   */
  function promptUrl(title) {
    var bodyHtml =
      '<div class="xp-dialog-info">🎵</div>' +
      '<div class="xp-dialog-message">Paste a YouTube URL:<input type="text" id="dialog-url-input" class="xp-dialog-input" placeholder="https://youtube.com/watch?v=..." autocomplete="off"></div>';

    return createDialog(title || 'Open URL', bodyHtml, [
      { label: 'OK', value: 'ok', primary: true },
      { label: 'Cancel', value: 'cancel' }
    ]);
  }

  /**
   * Escape a string for safe HTML insertion.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Public API
  return {
    createDialog: createDialog,
    showError: showError,
    showInfo: showInfo,
    promptUrl: promptUrl,
    closeCurrentDialog: closeCurrentDialog
  };
})();

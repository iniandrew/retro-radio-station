;(function () {
  'use strict';

  var taskbarEl = document.getElementById('taskbar');
  var clockEl   = null;
  var tabsEl    = null;
  var clockInterval = null;

  // ── Initialise ────────────────────────────────────────────────────────

  /**
   * Build the taskbar DOM and start the clock.
   */
  function init() {
    // Start button
    var startBtn = document.createElement('button');
    startBtn.id = 'start-btn';
    startBtn.className = 'taskbar-start';
    startBtn.textContent = 'start';
    startBtn.addEventListener('click', function () {
      // Future: open Start Menu
      if (window.Desktop && window.Desktop.initContextmenu) {
        // Trigger context menu at bottom-left for a start-menu feel
        var fakeEvent = new MouseEvent('contextmenu', {
          clientX: 4,
          clientY: window.innerHeight - 40,
          bubbles: true
        });
        document.getElementById('desktop').dispatchEvent(fakeEvent);
      }
    });

    // Tabs container
    tabsEl = document.createElement('div');
    tabsEl.id = 'taskbar-tabs';
    tabsEl.className = 'taskbar-tabs';

    // System tray
    var tray = document.createElement('div');
    tray.className = 'taskbar-tray';

    clockEl = document.createElement('div');
    clockEl.id = 'taskbar-clock';
    tray.appendChild(clockEl);

    // Assemble
    taskbarEl.appendChild(startBtn);
    taskbarEl.appendChild(tabsEl);
    taskbarEl.appendChild(tray);

    // Start clock
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }

  // ── Clock ──────────────────────────────────────────────────────────────

  /**
   * Update the clock display to HH:MM AM/PM.
   */
  function updateClock() {
    var now = new Date();
    var h   = now.getHours();
    var m   = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12;
    if (h === 0) h = 12;

    var hh = h < 10 ? '0' + h : '' + h;
    var mm = m < 10 ? '0' + m : '' + m;

    clockEl.textContent = hh + ':' + mm + ' ' + ampm;
  }

  // ── Window Tabs ───────────────────────────────────────────────────────

  /**
   * Add a button for an open window.
   * @param {string} id     Window id (e.g. 'winamp')
   * @param {string} title  Display title
   */
  function addWindowTab(id, title) {
    // Don't add duplicates
    if (document.getElementById('taskbar-tab-' + id)) return;

    var btn = document.createElement('button');
    btn.id = 'taskbar-tab-' + id;
    btn.className = 'taskbar-tab';
    btn.textContent = title;
    btn.title = title;

    btn.addEventListener('click', function () {
      if (window.WindowManager) {
        if (window.WindowManager.isMinimized && window.WindowManager.isMinimized(id)) {
          window.WindowManager.restore(id);
        } else {
          window.WindowManager.focus(id);
        }
      }
    });

    tabsEl.appendChild(btn);
  }

  /**
   * Remove a window tab.
   * @param {string} id
   */
  function removeWindowTab(id) {
    var tab = document.getElementById('taskbar-tab-' + id);
    if (tab) {
      tab.parentNode.removeChild(tab);
    }
  }

  /**
   * Toggle the minimized visual state of a tab.
   * @param {string}  id
   * @param {boolean} isMinimized
   */
  function markMinimized(id, isMinimized) {
    var tab = document.getElementById('taskbar-tab-' + id);
    if (tab) {
      if (isMinimized) {
        tab.classList.add('minimized');
      } else {
        tab.classList.remove('minimized');
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  window.Taskbar = {
    init:            init,
    updateClock:     updateClock,
    addWindowTab:    addWindowTab,
    removeWindowTab: removeWindowTab,
    markMinimized:   markMinimized
  };
})();

/**
 * WindowManager - XP-style window management system
 * Task 6: Draggable, minimizable, maximizable, closable windows
 */
window.WindowManager = (function () {
  'use strict';

  // Map of window id -> builder function
  var WINDOW_REGISTRY = {};

  // Active windows: Map of id -> {element, body, minimized, maximized, prevBounds}
  var windows = new Map();

  // Track the highest z-index used
  var topZ = 100;

  // Drag state
  var dragState = null;

  // Resize state
  var resizeState = null;

  // Reference to the container element
  function getContainer() {
    return document.getElementById('windows-container');
  }

  /**
   * Register a window config builder.
   * @param {string} id - Unique window identifier
   * @param {function} builder - Function that returns config object:
   *   {title, x, y, width, height, content}
   *   content can be string HTML or function(bodyElement)
   */
  function register(id, builder) {
    WINDOW_REGISTRY[id] = builder;
  }

  /**
   * Open a window by id. If already open, focus it.
   */
  function open(id) {
    // If already open, just focus
    if (windows.has(id)) {
      var existing = windows.get(id);
      if (existing.minimized) {
        restore(id);
      } else {
        focus(id);
      }
      return;
    }

    var builder = WINDOW_REGISTRY[id];
    if (!builder) {
      console.warn('WindowManager: no builder registered for "' + id + '"');
      return;
    }

    var config = builder();
    createWindow(id, config);
  }

  /**
   * Close a window by id.
   */
  function close(id) {
    var win = windows.get(id);
    if (!win) return;

    win.element.classList.add('closing');
    setTimeout(function () {
      win.element.remove();
      windows.delete(id);

      if (window.Taskbar && Taskbar.removeWindowTab) {
        Taskbar.removeWindowTab(id);
      }
    }, 150);
  }

  /**
   * Minimize a window by id.
   */
  function minimize(id) {
    var win = windows.get(id);
    if (!win) return;

    win.element.style.display = 'none';
    win.minimized = true;

    if (window.Taskbar && Taskbar.markMinimized) {
      Taskbar.markMinimized(id, true);
    }
  }

  /**
   * Restore a minimized window.
   */
  function restore(id) {
    var win = windows.get(id);
    if (!win) return;

    win.element.style.display = 'flex';
    win.element.classList.remove('restoring');
    // Force reflow to restart animation
    void win.element.offsetWidth;
    win.element.classList.add('restoring');
    win.minimized = false;

    focus(id);

    if (window.Taskbar && Taskbar.markMinimized) {
      Taskbar.markMinimized(id, false);
    }
  }

  /**
   * Toggle maximize/restore.
   */
  function maximize(id) {
    var win = windows.get(id);
    if (!win) return;

    // Add transition class for smooth animation
    win.element.classList.add('maximizing');

    if (win.maximized) {
      // Restore to previous bounds
      var bounds = win.prevBounds;
      win.element.style.left = bounds.left + 'px';
      win.element.style.top = bounds.top + 'px';
      win.element.style.width = bounds.width + 'px';
      win.element.style.height = bounds.height + 'px';
      win.element.style.borderRadius = '8px 8px 0 0';
      win.maximized = false;
    } else {
      // Save current bounds before maximizing
      win.prevBounds = {
        left: parseInt(win.element.style.left, 10) || 0,
        top: parseInt(win.element.style.top, 10) || 0,
        width: parseInt(win.element.style.width, 10) || 400,
        height: parseInt(win.element.style.height, 10) || 300
      };

      // Maximize to fill desktop area (below taskbar)
      win.element.style.left = '0px';
      win.element.style.top = '0px';
      win.element.style.width = '100%';
      win.element.style.height = (window.innerHeight - 40) + 'px';
      win.element.style.borderRadius = '0';
      win.maximized = true;
    }

    // Remove transition class after animation completes
    setTimeout(function () {
      if (win.element) win.element.classList.remove('maximizing');
    }, 200);

    // Update titlebar maximize button text
    var maxBtn = win.element.querySelector('.window-btn-maximize');
    if (maxBtn) {
      maxBtn.textContent = win.maximized ? '□' : '■';
      maxBtn.title = win.maximized ? 'Restore Down' : 'Maximize';
    }
  }

  /**
   * Bring a window to the front.
   */
  function focus(id) {
    var win = windows.get(id);
    if (!win) return;

    // If minimized, restore first
    if (win.minimized) {
      restore(id);
      return;
    }

    topZ++;
    win.element.style.zIndex = topZ;

    if (window.Taskbar && Taskbar.focusTab) {
      Taskbar.focusTab(id);
    }
  }

  /**
   * Create the DOM element for a window.
   * @param {string} id
   * @param {object} config - {title, x, y, width, height, content}
   */
  function createWindow(id, config) {
    var container = getContainer();
    if (!container) return;

    // Window element
    var winEl = document.createElement('div');
    winEl.className = 'window';
    winEl.id = 'window-' + id;
    winEl.style.left = (config.x || 100) + 'px';
    winEl.style.top = (config.y || 100) + 'px';
    winEl.style.width = (config.width || 400) + 'px';
    winEl.style.height = (config.height || 300) + 'px';
    winEl.style.zIndex = ++topZ;

    // Titlebar
    var titlebar = document.createElement('div');
    titlebar.className = 'window-titlebar';

    var title = document.createElement('span');
    title.className = 'window-title';
    title.textContent = config.title || 'Window';

    var controls = document.createElement('div');
    controls.className = 'window-controls';

    // Minimize button
    var minBtn = document.createElement('button');
    minBtn.className = 'window-btn window-btn-minimize';
    minBtn.textContent = '—';
    minBtn.title = 'Minimize';
    minBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      minimize(id);
    });

    // Maximize button
    var maxBtn = document.createElement('button');
    maxBtn.className = 'window-btn window-btn-maximize';
    maxBtn.textContent = '■';
    maxBtn.title = 'Maximize';
    maxBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      maximize(id);
    });

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'window-btn window-btn-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      close(id);
    });

    controls.appendChild(minBtn);
    controls.appendChild(maxBtn);
    controls.appendChild(closeBtn);

    titlebar.appendChild(title);
    titlebar.appendChild(controls);

    // Body
    var body = document.createElement('div');
    body.className = 'window-body';

    // Populate content
    if (typeof config.content === 'string') {
      body.innerHTML = config.content;
    } else if (typeof config.content === 'function') {
      config.content(body);
    }

    winEl.appendChild(titlebar);
    winEl.appendChild(body);

    // Click anywhere in window focuses it
    winEl.addEventListener('mousedown', function () {
      focus(id);
    });

    // Double-click titlebar to maximize/restore
    titlebar.addEventListener('dblclick', function (e) {
      if (e.target.closest('.window-controls')) return;
      maximize(id);
    });

    // Dragging setup (on titlebar only, not on controls)
    titlebar.addEventListener('mousedown', function (e) {
      // Don't drag if clicking a control button
      if (e.target.closest('.window-controls')) return;
      // Don't drag if window is maximized
      var win = windows.get(id);
      if (win && win.maximized) return;

      e.preventDefault();

      var rect = winEl.getBoundingClientRect();
      dragState = {
        id: id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };

      focus(id);
    });

    // Store window info
    windows.set(id, {
      element: winEl,
      body: body,
      minimized: false,
      maximized: false,
      prevBounds: null
    });

    // Resize handle
    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'window-resize-handle';
    winEl.appendChild(resizeHandle);

    resizeHandle.addEventListener('mousedown', function (e) {
      var win = windows.get(id);
      if (win && win.maximized) return;
      e.preventDefault();
      e.stopPropagation();

      resizeState = {
        id: id,
        startX: e.clientX,
        startY: e.clientY,
        startW: winEl.offsetWidth,
        startH: winEl.offsetHeight
      };

      focus(id);
    });

    container.appendChild(winEl);

    // Notify taskbar
    if (window.Taskbar && Taskbar.addWindowTab) {
      Taskbar.addWindowTab(id, config.title || 'Window');
    }

    focus(id);
  }

  // Global mouse handlers for dragging and resizing
  document.addEventListener('mousemove', function (e) {
    // Handle resize
    if (resizeState) {
      var rw = windows.get(resizeState.id);
      if (!rw) { resizeState = null; return; }

      var newW = Math.max(200, resizeState.startW + (e.clientX - resizeState.startX));
      var newH = Math.max(100, resizeState.startH + (e.clientY - resizeState.startY));

      // Clamp to viewport
      var rect = rw.element.getBoundingClientRect();
      newW = Math.min(newW, window.innerWidth - rect.left);
      newH = Math.min(newH, window.innerHeight - rect.top - 40);

      rw.element.style.width = newW + 'px';
      rw.element.style.height = newH + 'px';
      return;
    }

    if (!dragState) return;

    var win = windows.get(dragState.id);
    if (!win) {
      dragState = null;
      return;
    }

    var x = e.clientX - dragState.offsetX;
    var y = e.clientY - dragState.offsetY;

    // Clamp to viewport — allow the window to be partially off-screen
    // but keep at least the titlebar accessible
    var maxX = window.innerWidth - 60;
    var maxY = window.innerHeight - 24;

    x = Math.max(-win.element.offsetWidth + 60, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    win.element.style.left = x + 'px';
    win.element.style.top = y + 'px';
  });

  document.addEventListener('mouseup', function () {
    dragState = null;
    resizeState = null;
  });

  // Public API
  return {
    register: register,
    open: open,
    close: close,
    minimize: minimize,
    restore: restore,
    maximize: maximize,
    focus: focus,
    isMinimized: function (id) { var w = windows.get(id); return w ? w.minimized : false; },
    getWindows: function () { return windows; }
  };
})();

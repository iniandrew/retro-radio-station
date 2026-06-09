;(function () {
  'use strict';

  // ── Icons definition ──────────────────────────────────────────────────
  var ICONS = [
    { id: 'my-music',    label: 'My Music',    emoji: '\u{1F3B5}', action: 'open-winamp' },
    { id: 'trending',    label: 'Trending',     emoji: '\u{1F525}', action: 'open-trending' },
    { id: 'about',       label: 'About',        emoji: '\u{2139}\u{FE0F}', action: 'open-about' },
    { id: 'recycle-bin', label: 'Recycle Bin',  emoji: '\u{1F5D1}\u{FE0F}', action: null }
  ];

  var desktopEl    = document.getElementById('desktop');
  var iconsEl      = document.getElementById('desktop-icons');
  var contextEl    = document.getElementById('context-menu');
  var selectedIcon = null;

  // ── Wallpaper ─────────────────────────────────────────────────────────

  /**
   * Initialise wallpaper from localStorage.
   */
  function initWallpaper() {
    var name = localStorage.getItem('wallpaper') || 'bliss';
    setWallpaper(name);
  }

  /**
   * Apply a named wallpaper and persist the choice.
   * @param {string} name  e.g. 'bliss' or 'aurora'
   */
  function setWallpaper(name) {
    // Remove any previous wallpaper- class
    desktopEl.className = desktopEl.className
      .replace(/wallpaper-\S+/g, '')
      .trim();
    desktopEl.classList.add('wallpaper-' + name);
    localStorage.setItem('wallpaper', name);
  }

  // ── Context Menu ─────────────────────────────────────────────────────

  function initContextmenu() {
    desktopEl.addEventListener('contextmenu', function (e) {
      e.preventDefault();

      // Build menu items
      contextEl.innerHTML = '';

      addMenuItem('Change Wallpaper → Bliss', function () { setWallpaper('bliss'); });
      addMenuItem('Change Wallpaper → Aurora', function () { setWallpaper('aurora'); });
      addSeparator();
      addMenuItem('Toggle Now Playing Widget', function () {
        if (window.NowPlayingWidget) NowPlayingWidget.toggle();
      });
      addSeparator();
      addMenuItem('Refresh', function () { location.reload(); });
      addSeparator();
      addMenuItem('Properties', function () {
        // Future: open a properties dialog
        if (window.Dialog && window.Dialog.showInfo) {
          window.Dialog.showInfo('Desktop Properties', 'Retro Radio Station Desktop\n\nWallpaper: ' + (localStorage.getItem('wallpaper') || 'bliss'));
        }
      });

      // Position near cursor, clamped to viewport
      var x = e.clientX;
      var y = e.clientY;
      contextEl.classList.remove('hidden');
      contextEl.style.left = x + 'px';
      contextEl.style.top  = y + 'px';

      // Clamp if menu overflows right or bottom
      requestAnimationFrame(function () {
        var rect = contextEl.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          contextEl.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
          contextEl.style.top = (y - rect.height) + 'px';
        }
      });
    });

    // Hide on any left-click elsewhere
    document.addEventListener('click', function (e) {
      if (!contextEl.contains(e.target)) {
        contextEl.classList.add('hidden');
      }
    });
  }

  function addMenuItem(label, handler) {
    var item = document.createElement('div');
    item.className = 'context-menu-item';
    item.textContent = label;
    item.addEventListener('click', function () {
      handler();
      contextEl.classList.add('hidden');
    });
    contextEl.appendChild(item);
  }

  function addSeparator() {
    var sep = document.createElement('div');
    sep.className = 'context-menu-separator';
    contextEl.appendChild(sep);
  }

  // ── Desktop Icons ─────────────────────────────────────────────────────

  /**
   * Build the desktop icons from the ICONS array.
   */
  function initIcons() {
    ICONS.forEach(function (iconDef) {
      var icon = document.createElement('div');
      icon.className = 'desktop-icon';
      icon.dataset.id     = iconDef.id;
      icon.dataset.action = iconDef.action || '';

      var img    = document.createElement('div');
      img.className   = 'desktop-icon-img';
      img.textContent = iconDef.emoji;

      var label  = document.createElement('div');
      label.className   = 'desktop-icon-label';
      label.textContent = iconDef.label;

      icon.appendChild(img);
      icon.appendChild(label);

      // Single click → select
      icon.addEventListener('click', function (e) {
        e.stopPropagation();
        selectIcon(icon);
      });

      // Double click → action
      icon.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        handleIconAction(iconDef.action);
      });

      iconsEl.appendChild(icon);
    });

    // Deselect all when clicking the desktop background
    desktopEl.addEventListener('click', function (e) {
      if (e.target === desktopEl || e.target === iconsEl) {
        deselectAll();
      }
    });
  }

  function selectIcon(iconEl) {
    deselectAll();
    iconEl.classList.add('selected');
    selectedIcon = iconEl;
  }

  function deselectAll() {
    var icons = iconsEl.querySelectorAll('.desktop-icon');
    for (var i = 0; i < icons.length; i++) {
      icons[i].classList.remove('selected');
    }
    selectedIcon = null;
  }

  /**
   * Dispatch an icon action.
   * @param {string|null} action
   */
  function handleIconAction(action) {
    if (!action) return;

    switch (action) {
      case 'open-winamp':
        if (window.WindowManager && window.WindowManager.open) {
          window.WindowManager.open('winamp');
        }
        break;

      case 'open-trending':
        if (window.WindowManager && window.WindowManager.open) {
          window.WindowManager.open('trending');
        }
        break;

      case 'open-about':
        if (window.Dialog && window.Dialog.showInfo) {
          window.Dialog.showInfo(
            'About Retro Radio',
            'Retro Radio Station v1.0\n\nA nostalgia web radio themed\nas a Windows XP desktop.\n\nDouble-click icons to explore!'
          );
        }
        break;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  window.Desktop = {
    setWallpaper:    setWallpaper,
    initWallpaper:   initWallpaper,
    initContextmenu: initContextmenu,
    initIcons:       initIcons
  };
})();

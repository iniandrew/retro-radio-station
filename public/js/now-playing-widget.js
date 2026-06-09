/**
 * NowPlayingWidget - Floating desktop widget showing current track info
 * Togglable from desktop right-click context menu.
 */
window.NowPlayingWidget = (function () {
  'use strict';

  var widgetEl = null;
  var visible = false;
  var seekSlider = null;

  /**
   * Build the widget DOM.
   */
  function create() {
    if (widgetEl) return;

    widgetEl = document.createElement('div');
    widgetEl.className = 'now-playing-widget';
    widgetEl.id = 'now-playing-widget';

    // Header
    var header = document.createElement('div');
    header.className = 'np-widget-header';

    var title = document.createElement('span');
    title.className = 'np-widget-title';
    title.textContent = '♫ NOW PLAYING';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'np-widget-close';
    closeBtn.textContent = 'X';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function () {
      toggle(false);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    var body = document.createElement('div');
    body.className = 'np-widget-body';

    var trackEl = document.createElement('div');
    trackEl.className = 'np-widget-track';
    trackEl.id = 'np-widget-track';
    trackEl.textContent = 'Nothing playing';

    var timeEl = document.createElement('div');
    timeEl.className = 'np-widget-time';
    timeEl.id = 'np-widget-time';
    timeEl.textContent = '';

    // Controls
    var controls = document.createElement('div');
    controls.className = 'np-widget-controls';

    var btnDefs = [
      { icon: '|<', title: 'Previous', action: function () { if (window.Playlist) Playlist.playPrev(); } },
      { icon: '>', title: 'Play / Pause', action: function () {
        if (window.Player) {
          var s = Player.getState();
          if (s.isPlaying) Player.pause(); else if (s.currentTrack) Player.resume();
        }
      }},
      { icon: '>|', title: 'Next', action: function () {
        if (window.Playlist) Playlist.playNext(false, false);
      }}
    ];

    for (var i = 0; i < btnDefs.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'np-widget-btn';
      btn.textContent = btnDefs[i].icon;
      btn.title = btnDefs[i].title;
      btn.addEventListener('click', btnDefs[i].action);
      controls.appendChild(btn);
    }

    // Seek
    var seekWrap = document.createElement('div');
    seekWrap.className = 'np-widget-seek';
    seekSlider = document.createElement('input');
    seekSlider.type = 'range';
    seekSlider.min = '0';
    seekSlider.max = '100';
    seekSlider.value = '0';
    seekSlider.addEventListener('input', function () {
      if (window.Player) {
        var state = Player.getState();
        var fraction = parseInt(seekSlider.value, 10) / 100;
        Player.seekTo(fraction * (state.duration || 0));
      }
    });
    seekWrap.appendChild(seekSlider);

    body.appendChild(trackEl);
    body.appendChild(timeEl);
    body.appendChild(controls);
    body.appendChild(seekWrap);

    widgetEl.appendChild(header);
    widgetEl.appendChild(body);

    // Make header draggable
    var dragState = null;
    header.addEventListener('mousedown', function (e) {
      if (e.target === closeBtn || closeBtn.contains(e.target)) return;
      e.preventDefault();
      var rect = widgetEl.getBoundingClientRect();
      dragState = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragState || !widgetEl) return;
      var x = Math.max(0, Math.min(e.clientX - dragState.offsetX, window.innerWidth - widgetEl.offsetWidth));
      var y = Math.max(0, Math.min(e.clientY - dragState.offsetY, window.innerHeight - 48 - widgetEl.offsetHeight));
      widgetEl.style.left = x + 'px';
      widgetEl.style.top = y + 'px';
      widgetEl.style.right = 'auto';
      widgetEl.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', function () {
      dragState = null;
    });

    document.body.appendChild(widgetEl);
  }

  /**
   * Toggle widget visibility.
   * @param {boolean} [show] - Force show/hide, or toggle if undefined
   */
  function toggle(show) {
    if (typeof show === 'undefined') {
      show = !visible;
    }

    if (show) {
      if (!widgetEl) create();
      widgetEl.classList.remove('hiding');
      widgetEl.style.display = '';
      visible = true;
      // Sync state immediately
      if (window.Player) update(Player.getState());
    } else if (widgetEl) {
      widgetEl.classList.add('hiding');
      setTimeout(function () {
        if (widgetEl) widgetEl.style.display = 'none';
      }, 250);
      visible = false;
    }

    // Persist preference
    try { localStorage.setItem('np-widget-visible', visible ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  /**
   * Update widget display from player state.
   * Called by Player.updateDisplay().
   * @param {Object} state
   */
  function update(state) {
    if (!widgetEl || !visible) return;

    var trackEl = document.getElementById('np-widget-track');
    var timeEl = document.getElementById('np-widget-time');

    // Toggle playing glow state
    if (state.isPlaying) {
      widgetEl.classList.add('playing');
    } else {
      widgetEl.classList.remove('playing');
    }

    if (trackEl) {
      if (state.currentTrack) {
        trackEl.textContent = state.currentTrack.title || 'Unknown Track';
      } else {
        trackEl.innerHTML = '<span class="np-widget-empty">Nothing playing</span>';
      }
    }

    if (timeEl) {
      if (window.Player) {
        timeEl.textContent = Player.formatTime(state.elapsed) + ' / ' + Player.formatTime(state.duration);
      }
    }

    if (seekSlider) {
      var pct = state.duration > 0 ? (state.elapsed / state.duration) * 100 : 0;
      seekSlider.value = pct;
      seekSlider.style.setProperty('--seek-pct', pct + '%');
    }
  }

  /**
   * Check if widget is visible.
   * @returns {boolean}
   */
  function isVisible() {
    return visible;
  }

  return { toggle: toggle, update: update, isVisible: isVisible };
})();

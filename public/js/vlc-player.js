/**
 * VLC Player - VLC 2.x era video player window
 * Uses the shared Player API for YouTube playback
 */
;(function () {
  'use strict';

  var YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

  /**
   * Build VLC player content inside the window body.
   * @param {HTMLElement} body
   */
  function buildVlcContent(body) {
    var player = document.createElement('div');
    player.className = 'vlc-player';

    // ---- Title Bar ----
    var titlebar = document.createElement('div');
    titlebar.className = 'vlc-titlebar';

    var cone = document.createElement('div');
    cone.className = 'vlc-cone-icon';
    titlebar.appendChild(cone);

    var titleText = document.createElement('div');
    titleText.className = 'vlc-titlebar-text';
    titleText.id = 'vlc-title-text';
    titleText.textContent = 'VLC media player';
    titlebar.appendChild(titleText);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'vlc-titlebar-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', function () {
      if (window.WindowManager) WindowManager.close('vlc');
    });
    titlebar.appendChild(closeBtn);

    // ---- Menu Bar ----
    var menubar = document.createElement('div');
    menubar.className = 'vlc-menubar';

    var menuItems = ['Media', 'Playback', 'Audio', 'Video', 'Help'];
    for (var m = 0; m < menuItems.length; m++) {
      var item = document.createElement('div');
      item.className = 'vlc-menu-item';
      item.textContent = menuItems[m];
      if (menuItems[m] === 'Media') {
        (function (el) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', function () {
            handleVlcAddUrl();
          });
        })(item);
      }
      menubar.appendChild(item);
    }

    // ---- Video Area ----
    var videoArea = document.createElement('div');
    videoArea.className = 'vlc-video-area';
    videoArea.id = 'vlc-video-area';
    videoArea.innerHTML =
      '<div class="vlc-video-placeholder">' +
      '<div class="vlc-video-placeholder-cone">🔶</div>' +
      '<div class="vlc-video-placeholder-text">Drop media here or use Media > Open</div>' +
      '</div>';

    // ---- Controls ----
    var controls = document.createElement('div');
    controls.className = 'vlc-controls';

    // Progress bar
    var progress = document.createElement('div');
    progress.className = 'vlc-progress';

    var progressBar = document.createElement('div');
    progressBar.className = 'vlc-progress-bar';
    progressBar.id = 'vlc-progress-bar';

    var progressFill = document.createElement('div');
    progressFill.className = 'vlc-progress-fill';
    progressFill.id = 'vlc-progress-fill';
    progressBar.appendChild(progressFill);
    progress.appendChild(progressBar);

    // Time row
    var timeRow = document.createElement('div');
    timeRow.className = 'vlc-time';

    var timeCurrent = document.createElement('span');
    timeCurrent.className = 'vlc-time-current';
    timeCurrent.id = 'vlc-time-current';
    timeCurrent.textContent = '00:00';
    timeRow.appendChild(timeCurrent);

    var timeSep = document.createElement('span');
    timeSep.className = 'vlc-time-separator';
    timeSep.textContent = '/';
    timeRow.appendChild(timeSep);

    var timeTotal = document.createElement('span');
    timeTotal.className = 'vlc-time-total';
    timeTotal.id = 'vlc-time-total';
    timeTotal.textContent = '00:00';
    timeRow.appendChild(timeTotal);

    var trackTitle = document.createElement('span');
    trackTitle.className = 'vlc-track-title';
    trackTitle.id = 'vlc-track-title';
    timeRow.appendChild(trackTitle);

    // Transport buttons
    var transport = document.createElement('div');
    transport.className = 'vlc-transport';

    var btnDefs = [
      { cls: 'vlc-btn', icon: '⏮', title: 'Previous', id: 'vlc-btn-prev' },
      { cls: 'vlc-btn', icon: '⏪', title: 'Rewind', id: 'vlc-btn-rewind' },
      { cls: 'vlc-btn vlc-btn-play', icon: '▶', title: 'Play', id: 'vlc-btn-play' },
      { cls: 'vlc-btn', icon: '⏹', title: 'Stop', id: 'vlc-btn-stop' },
      { cls: 'vlc-btn', icon: '⏩', title: 'Forward', id: 'vlc-btn-forward' },
      { cls: 'vlc-btn', icon: '⏭', title: 'Next', id: 'vlc-btn-next' }
    ];

    for (var b = 0; b < btnDefs.length; b++) {
      var btn = document.createElement('button');
      btn.className = btnDefs[b].cls;
      btn.textContent = btnDefs[b].icon;
      btn.title = btnDefs[b].title;
      btn.id = btnDefs[b].id;
      transport.appendChild(btn);
    }

    // Volume
    var volume = document.createElement('div');
    volume.className = 'vlc-volume';

    var volIcon = document.createElement('span');
    volIcon.className = 'vlc-volume-icon';
    volIcon.id = 'vlc-volume-icon';
    volIcon.textContent = '🔊';
    volume.appendChild(volIcon);

    var volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '100';
    volSlider.value = '80';
    volSlider.className = 'vlc-volume-slider';
    volSlider.id = 'vlc-volume-slider';
    volume.appendChild(volSlider);

    // Drop overlay
    var dropOverlay = document.createElement('div');
    dropOverlay.className = 'vlc-drop-overlay';
    dropOverlay.textContent = 'Drop YouTube URL here';
    videoArea.appendChild(dropOverlay);

    // Assemble controls
    controls.appendChild(progress);
    controls.appendChild(timeRow);
    controls.appendChild(transport);
    controls.appendChild(volume);

    // ---- Status Bar ----
    var statusbar = document.createElement('div');
    statusbar.className = 'vlc-statusbar';

    var statusIndicator = document.createElement('div');
    statusIndicator.className = 'vlc-status-indicator';
    statusIndicator.id = 'vlc-status-indicator';
    statusbar.appendChild(statusIndicator);

    var statusText = document.createElement('div');
    statusText.className = 'vlc-status-text';
    statusText.id = 'vlc-status-text';
    statusText.textContent = 'Ready';
    statusbar.appendChild(statusText);

    // Assemble player
    player.appendChild(titlebar);
    player.appendChild(menubar);
    player.appendChild(videoArea);
    player.appendChild(controls);
    player.appendChild(statusbar);
    body.appendChild(player);

    // Wire up
    initVlcControls(body);
    initVlcDragDrop(body);
    startVlcPoller();
  }

  /**
   * Wire up VLC transport, volume, seek controls.
   */
  function initVlcControls(body) {
    // Play/Pause
    var playBtn = body.querySelector('#vlc-btn-play');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (window.Player) {
          var state = Player.getState();
          if (state.isPlaying) {
            Player.pause();
          } else if (state.currentTrack) {
            Player.resume();
          } else {
            // Try playlist first track
            if (window.Playlist) {
              var first = Playlist.getFirst();
              if (first) Playlist.playIndex(0);
            }
          }
        }
      });
    }

    // Stop
    var stopBtn = body.querySelector('#vlc-btn-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        if (window.Player) Player.stop();
      });
    }

    // Previous
    var prevBtn = body.querySelector('#vlc-btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (window.Playlist) Playlist.playPrev();
      });
    }

    // Next
    var nextBtn = body.querySelector('#vlc-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (window.Playlist) Playlist.playNext(false, false);
      });
    }

    // Rewind (skip back 10s)
    var rewindBtn = body.querySelector('#vlc-btn-rewind');
    if (rewindBtn) {
      rewindBtn.addEventListener('click', function () {
        if (window.Player) {
          var s = Player.getState();
          Player.seekTo(Math.max(s.elapsed - 10, 0));
        }
      });
    }

    // Forward (skip forward 10s)
    var fwdBtn = body.querySelector('#vlc-btn-forward');
    if (fwdBtn) {
      fwdBtn.addEventListener('click', function () {
        if (window.Player) {
          var s = Player.getState();
          Player.seekTo(Math.min(s.elapsed + 10, s.duration || 0));
        }
      });
    }

    // Progress bar click-to-seek
    var progressBar = body.querySelector('#vlc-progress-bar');
    if (progressBar) {
      progressBar.addEventListener('click', function (e) {
        if (!window.Player) return;
        var rect = progressBar.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        var state = Player.getState();
        Player.seekTo(pct * (state.duration || 0));
      });
    }

    // Volume slider
    var volSlider = body.querySelector('#vlc-volume-slider');
    if (volSlider) {
      volSlider.addEventListener('input', function () {
        if (window.Player) {
          Player.setVolume(parseInt(volSlider.value, 10));
        }
      });
    }

    // Volume icon click = mute toggle
    var volIcon = body.querySelector('#vlc-volume-icon');
    if (volIcon) {
      volIcon.addEventListener('click', function () {
        if (window.Player) {
          Player.toggleMute();
          var s = Player.getState();
          volSlider.value = s.volume;
        }
      });
    }

    // Track end → advance playlist
    if (window.Player) {
      Player.setTrackEndCallback(function () {
        if (window.Playlist) {
          Playlist.playNext(false, false);
        }
      });
    }
  }

  /**
   * Enable drag-and-drop of YouTube URLs onto the video area.
   */
  function initVlcDragDrop(body) {
    var videoArea = body.querySelector('#vlc-video-area');
    var player = body.querySelector('.vlc-player');
    if (!videoArea || !player) return;

    body.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      player.classList.add('drag-over');
    });

    body.addEventListener('dragleave', function (e) {
      if (!body.contains(e.relatedTarget)) {
        player.classList.remove('drag-over');
      }
    });

    body.addEventListener('drop', function (e) {
      e.preventDefault();
      player.classList.remove('drag-over');

      var text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      if (text) {
        processUrl(text.trim());
      }
    });
  }

  /**
   * Handle the Media menu "Open" action.
   */
  function handleVlcAddUrl() {
    if (!window.Dialog) return;

    Dialog.promptUrl('Open Media').then(function (result) {
      if (result !== 'ok') return;

      var input = document.getElementById('dialog-url-input');
      if (!input) return;

      var url = input.value.trim();
      if (url) processUrl(url);
    });
  }

  /**
   * Process a YouTube URL: resolve, add to playlist, play in VLC.
   */
  function processUrl(url) {
    var match = url.match(YOUTUBE_REGEX);
    if (!match || !match[1]) {
      if (window.Dialog) {
        Dialog.showError('Invalid URL', 'Please enter a valid YouTube URL.');
      }
      return;
    }

    var videoId = match[1];

    if (window.Api) {
      Api.resolveTrack(url)
        .then(function (track) {
          if (window.Playlist) Playlist.add(track);
          // Create VLC video player
          createVlcVideoPlayer(track);
        })
        .catch(function (err) {
          if (window.Dialog) {
            Dialog.showError('Resolve Error', err.message || 'Failed to resolve track.');
          }
        });
    }
  }

  /**
   * Create YouTube player inside VLC video area.
   */
  function createVlcVideoPlayer(track) {
    var videoArea = document.getElementById('vlc-video-area');
    if (!videoArea) return;

    videoArea.innerHTML = '';

    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      videoArea.innerHTML = '<div class="vlc-video-placeholder"><div class="vlc-video-placeholder-cone">🔶</div><div class="vlc-video-placeholder-text">YouTube API not loaded</div></div>';
      return;
    }

    // Update title
    var titleText = document.getElementById('vlc-title-text');
    if (titleText) titleText.textContent = track.title || 'VLC media player';

    // Play in VLC's own video area
    if (window.Player) Player.play(track, videoArea);
  }

  /**
   * Poll Player state to keep VLC UI in sync.
   * VLC reuses the shared Player API; this polls every 500ms.
   */
  function startVlcPoller() {
    setInterval(function () {
      if (!window.Player) return;

      var state = Player.getState();

      // Update play/pause button
      var playBtn = document.querySelector('#vlc-btn-play');
      if (playBtn) {
        if (state.isPlaying) {
          playBtn.textContent = '⏸';
          playBtn.classList.add('playing');
        } else {
          playBtn.textContent = '▶';
          playBtn.classList.remove('playing');
        }
      }

      // Update progress bar
      var progressFill = document.querySelector('#vlc-progress-fill');
      if (progressFill) {
        var pct = state.duration > 0 ? (state.elapsed / state.duration) * 100 : 0;
        progressFill.style.width = pct + '%';
      }

      // Update time
      var timeCurrent = document.querySelector('#vlc-time-current');
      var timeTotal = document.querySelector('#vlc-time-total');
      if (timeCurrent) timeCurrent.textContent = Player.formatTime(state.elapsed);
      if (timeTotal) timeTotal.textContent = Player.formatTime(state.duration);

      // Update track title
      var trackTitle = document.querySelector('#vlc-track-title');
      if (trackTitle && state.currentTrack) {
        trackTitle.textContent = state.currentTrack.title || '';
      }

      // Update volume slider
      var volSlider = document.querySelector('#vlc-volume-slider');
      if (volSlider) {
        volSlider.style.setProperty('--vlc-vol-pct', state.volume + '%');
        volSlider.value = state.volume;
      }

      // Update volume icon
      var volIcon = document.querySelector('#vlc-volume-icon');
      if (volIcon) {
        volIcon.classList.remove('muted');
        if (state.volume === 0) {
          volIcon.textContent = '🔇';
          volIcon.classList.add('muted');
        } else if (state.volume < 30) {
          volIcon.textContent = '🔈';
        } else if (state.volume < 70) {
          volIcon.textContent = '🔉';
        } else {
          volIcon.textContent = '🔊';
        }
      }

      // Update status bar
      var indicator = document.querySelector('#vlc-status-indicator');
      var statusText = document.querySelector('#vlc-status-text');
      if (indicator) {
        indicator.classList.remove('playing', 'buffering');
        if (state.isPlaying) {
          indicator.classList.add('playing');
        }
      }
      if (statusText) {
        if (state.isPlaying && state.currentTrack) {
          statusText.textContent = 'Playing: ' + (state.currentTrack.title || 'Unknown');
        } else if (state.currentTrack) {
          statusText.textContent = 'Paused';
        } else {
          statusText.textContent = 'Ready';
        }
      }
    }, 500);
  }

  // ---- Public API ----
  window.VlcPlayer = {
    buildVlcContent: buildVlcContent
  };
})();

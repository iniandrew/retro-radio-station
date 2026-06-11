/**
 * App - Entry point, registers Winamp window, wires everything together
 * Task 10: Winamp Player Window, Playlist, and App.js Integration
 */
;(function () {
  'use strict';

  // YouTube URL validation regex
  var YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

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

  /**
   * Build the Winamp player HTML inside the window body.
   * @param {HTMLElement} body
   */
  function buildWinampContent(body) {
    // Main wrapper
    var player = document.createElement('div');
    player.className = 'winamp-player';

    // ---- Main section ----
    var main = document.createElement('div');
    main.className = 'winamp-main';

    // Header
    var header = document.createElement('div');
    header.className = 'winamp-header';
    header.innerHTML = '<span class="winamp-logo">⚡ WINAMP</span>';
    var headerClose = document.createElement('button');
    headerClose.className = 'winamp-header-close';
    headerClose.textContent = 'X';
    headerClose.title = 'Close';
    headerClose.addEventListener('click', function () {
      if (window.WindowManager) WindowManager.close('winamp');
    });
    header.appendChild(headerClose);

    // Display
    var display = document.createElement('div');
    display.className = 'winamp-display';
    display.innerHTML =
      '<div class="winamp-time">00:00 / 00:00</div>' +
      '<div class="winamp-track-name"></div>' +
      '<div class="winamp-info">Stopped</div>';

    // Video area
    var videoArea = document.createElement('div');
    videoArea.className = 'winamp-video-area';
    videoArea.innerHTML = '<div class="winamp-video-placeholder">No video loaded</div>';

    // Seek slider
    var seek = document.createElement('div');
    seek.className = 'winamp-seek';
    var seekSlider = document.createElement('input');
    seekSlider.type = 'range';
    seekSlider.min = '0';
    seekSlider.max = '100';
    seekSlider.value = '0';
    seekSlider.className = 'winamp-seek-slider';
    seek.appendChild(seekSlider);

    // Transport controls
    var controls = document.createElement('div');
    controls.className = 'winamp-controls';

    var btnDefs = [
      { cls: 'winamp-btn', icon: '|<', title: 'Previous', id: 'btn-prev' },
      { cls: 'winamp-btn winamp-btn-play', icon: '>', title: 'Play / Pause', id: 'btn-play' },
      { cls: 'winamp-btn', icon: '[]', title: 'Stop', id: 'btn-stop' },
      { cls: 'winamp-btn', icon: '>|', title: 'Next', id: 'btn-next' },
      { cls: 'winamp-btn', icon: 'Eject', title: 'Open URL', id: 'btn-eject', wide: true },
      { cls: 'winamp-btn', icon: 'Shuf', title: 'Shuffle', id: 'btn-shuffle' },
      { cls: 'winamp-btn', icon: 'Rep', title: 'Repeat', id: 'btn-repeat' }
    ];

    for (var i = 0; i < btnDefs.length; i++) {
      var btn = document.createElement('button');
      btn.className = btnDefs[i].cls;
      btn.textContent = btnDefs[i].icon;
      btn.title = btnDefs[i].title;
      btn.id = btnDefs[i].id;
      if (btnDefs[i].wide) {
        btn.style.width = '42px';
      }
      controls.appendChild(btn);
    }

    // Volume
    var volume = document.createElement('div');
    volume.className = 'winamp-volume';
    volume.innerHTML = '<span class="winamp-volume-icon">\u{1F50A}</span>';
    var volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '80';
    volumeSlider.className = 'winamp-volume-slider';
    volume.appendChild(volumeSlider);

    // Spectrum analyzer (20 bars)
    var spectrum = document.createElement('div');
    spectrum.className = 'winamp-spectrum paused';
    for (var b = 0; b < 20; b++) {
      var bar = document.createElement('div');
      bar.className = 'winamp-spectrum-bar';
      bar.style.height = '2px';
      spectrum.appendChild(bar);
    }

    // Assemble main section
    main.appendChild(header);
    main.appendChild(display);
    main.appendChild(videoArea);
    main.appendChild(seek);
    main.appendChild(controls);
    main.appendChild(volume);
    main.appendChild(spectrum);

    // ---- Playlist panel ----
    var playlistPanel = document.createElement('div');
    playlistPanel.className = 'winamp-playlist-panel';

    // Playlist header
    var plHeader = document.createElement('div');
    plHeader.className = 'winamp-playlist-header';
    plHeader.innerHTML = '<span class="winamp-playlist-title">\u{1F4CB} Playlist</span>';
    var plActions = document.createElement('div');
    plActions.className = 'winamp-playlist-actions';

    var addBtn = document.createElement('button');
    addBtn.className = 'winamp-playlist-btn';
    addBtn.textContent = '+Add';
    addBtn.id = 'btn-pl-add';

    var removeBtn = document.createElement('button');
    removeBtn.className = 'winamp-playlist-btn';
    removeBtn.textContent = '-Rem';
    removeBtn.id = 'btn-pl-remove';

    plActions.appendChild(addBtn);
    plActions.appendChild(removeBtn);
    plHeader.appendChild(plActions);

    // Playlist list
    var plList = document.createElement('div');
    plList.className = 'winamp-playlist-list';

    // Trending section
    var trending = document.createElement('div');
    trending.className = 'winamp-trending';

    var trendingHeader = document.createElement('div');
    trendingHeader.className = 'winamp-trending-header';
    trendingHeader.id = 'trending-header';
    trendingHeader.innerHTML =
      '<span>\u{1F525} Trending</span>' +
      '<span class="winamp-trending-arrow">▼</span>';

    var trendingList = document.createElement('div');
    trendingList.className = 'winamp-trending-list';
    trendingList.id = 'trending-list';

    trending.appendChild(trendingHeader);
    trending.appendChild(trendingList);

    // Assemble playlist panel
    playlistPanel.appendChild(plHeader);
    playlistPanel.appendChild(plList);
    playlistPanel.appendChild(trending);

    // Assemble player
    player.appendChild(main);
    player.appendChild(playlistPanel);
    body.appendChild(player);

    // Wire up controls
    initPlayerControls(body);
    initPlaylistControls(body);
    initTrendingControls(body);
  }

  /**
   * Wire up player transport and volume/seek controls.
   * @param {HTMLElement} body
   */
  function initPlayerControls(body) {
    var shuffleOn = false;
    var repeatOn = false;

    // Previous
    var prevBtn = body.querySelector('#btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (window.Playlist) Playlist.playPrev();
      });
    }

    // Play (toggle play/pause)
    var playBtn = body.querySelector('#btn-play');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (window.Player) {
          var state = Player.getState();
          if (state.isPlaying) {
            Player.pause();
          } else if (state.currentTrack) {
            Player.resume();
          } else {
            // Nothing loaded — try playlist first track
            if (window.Playlist) {
              var first = Playlist.getFirst();
              if (first) {
                Playlist.playIndex(0);
              }
            }
          }
        }
      });
    }

    // Stop
    var stopBtn = body.querySelector('#btn-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        if (window.Player) Player.stop();
      });
    }

    // Next
    var nextBtn = body.querySelector('#btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (window.Playlist) Playlist.playNext(shuffleOn, repeatOn);
      });
    }

    // Eject (Open URL)
    var ejectBtn = body.querySelector('#btn-eject');
    if (ejectBtn) {
      ejectBtn.addEventListener('click', function () {
        handleAddUrl();
      });
    }

    // Shuffle toggle
    var shuffleBtn = body.querySelector('#btn-shuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function () {
        shuffleOn = !shuffleOn;
        if (shuffleOn) {
          shuffleBtn.classList.add('active');
        } else {
          shuffleBtn.classList.remove('active');
        }
      });
    }

    // Repeat toggle
    var repeatBtn = body.querySelector('#btn-repeat');
    if (repeatBtn) {
      repeatBtn.addEventListener('click', function () {
        repeatOn = !repeatOn;
        if (repeatOn) {
          repeatBtn.classList.add('active');
        } else {
          repeatBtn.classList.remove('active');
        }
      });
    }

    // Volume slider
    var volumeSlider = body.querySelector('.winamp-volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', function () {
        if (window.Player) {
          Player.setVolume(parseInt(volumeSlider.value, 10));
        }
      });
    }

    // Click volume icon to toggle mute
    var volumeIcon = body.querySelector('.winamp-volume-icon');
    if (volumeIcon) {
      volumeIcon.style.cursor = 'pointer';
      volumeIcon.addEventListener('click', function () {
        if (window.Player) {
          Player.toggleMute();
          // Sync slider position
          var s = Player.getState();
          volumeSlider.value = s.volume;
        }
      });
    }

    // Seek slider
    var seekSlider = body.querySelector('.winamp-seek-slider');
    if (seekSlider) {
      seekSlider.addEventListener('input', function () {
        if (window.Player) {
          var state = Player.getState();
          var fraction = parseInt(seekSlider.value, 10) / 100;
          Player.seekTo(fraction * (state.duration || 0));
        }
      });
    }

    // Auto-advance on track end
    if (window.Player) {
      Player.setTrackEndCallback(function () {
        if (window.Playlist) {
          Playlist.playNext(shuffleOn, repeatOn);
        }
      });
    }
  }

  /**
   * Wire up playlist add/remove buttons.
   * @param {HTMLElement} body
   */
  function initPlaylistControls(body) {
    var addBtn = body.querySelector('#btn-pl-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        handleAddUrl();
      });
    }

    var removeBtn = body.querySelector('#btn-pl-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        if (window.Playlist) {
          Playlist.removeSelected();
        }
      });
    }
  }

  /**
   * Bind single-click (add to playlist) and double-click (add + play) to an element.
   * Uses a timeout to distinguish single from double click.
   */
  function bindTrendingClick(el, trackData) {
    var clickTimer = null;

    el.addEventListener('click', function () {
      if (clickTimer) return;
      clickTimer = setTimeout(function () {
        clickTimer = null;
        if (window.Playlist) Playlist.add(trackData);
      }, 300);
    });

    el.addEventListener('dblclick', function () {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      if (window.Playlist) Playlist.add(trackData);
      if (window.Player) Player.play(trackData);
    });
  }

  /**
   * Handle adding a URL: prompt, validate, resolve, add to playlist.
   */
  function handleAddUrl() {
    if (!window.Dialog) return;

    Dialog.promptUrl('Add Track').then(function (result) {
      if (result !== 'ok') return;

      var input = document.getElementById('dialog-url-input');
      if (!input) return;

      var url = input.value.trim();
      if (!url) return;

      var match = url.match(YOUTUBE_REGEX);
      if (!match || !match[1]) {
        Dialog.showError('Invalid URL', 'Please enter a valid YouTube URL.');
        return;
      }

      var videoId = match[1];

      if (window.Api) {
        Api.resolveTrack(url)
          .then(function (track) {
            if (window.Playlist) {
              Playlist.add(track);
            }
          })
          .catch(function (err) {
            if (window.Dialog) {
              Dialog.showError('Resolve Error', err.message || 'Failed to resolve track.');
            }
          });
      }
    });
  }

  /**
   * Wire up trending section controls.
   * @param {HTMLElement} body
   */
  function initTrendingControls(body) {
    var trendingHeader = body.querySelector('#trending-header');
    var trendingList = body.querySelector('#trending-list');

    if (trendingHeader) {
      trendingHeader.addEventListener('click', function () {
        var isOpen = trendingList.classList.contains('open');
        if (isOpen) {
          trendingList.classList.remove('open');
          trendingHeader.classList.remove('open');
        } else {
          trendingList.classList.add('open');
          trendingHeader.classList.add('open');
          loadTrending();
        }
      });
    }
  }

  /**
   * Initialize global keyboard shortcuts.
   */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      var winampOpen = window.WindowManager && WindowManager.getWindows().has('winamp');

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (window.Player) {
            var s = Player.getState();
            if (s.isPlaying) Player.pause();
            else if (s.currentTrack) Player.resume();
            else if (window.Playlist) {
              var first = Playlist.getFirst();
              if (first) Playlist.playIndex(0);
            }
          }
          break;

        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (window.Player) {
              var st = Player.getState();
              Player.seekTo(Math.min(st.elapsed + 10, st.duration || 0));
            }
          }
          break;

        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (window.Player) {
              var st2 = Player.getState();
              Player.seekTo(Math.max(st2.elapsed - 10, 0));
            }
          }
          break;

        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (window.Player) {
              var s3 = Player.getState();
              Player.setVolume(Math.min(s3.volume + 5, 100));
            }
          }
          break;

        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (window.Player) {
              var s4 = Player.getState();
              Player.setVolume(Math.max(s4.volume - 5, 0));
            }
          }
          break;

        case 'KeyM':
          if (window.Player) Player.toggleMute();
          break;

        case 'KeyN':
          if (e.ctrlKey || e.metaKey) break; // don't hijack new window
          if (window.Playlist) Playlist.playNext(false, false);
          break;

        case 'KeyP':
          if (window.Playlist) Playlist.playPrev();
          break;

        case 'KeyW':
          if (winampOpen && window.WindowManager) {
            WindowManager.close('winamp');
          }
          break;

        case 'KeyT':
          if (window.NowPlayingWidget) NowPlayingWidget.toggle();
          break;
      }
    });
  }

  /**
   * Hook into Playlist.add to show a toast when a track is added.
   */
  function hookPlaylistToast() {
    var origAdd = Playlist.add;
    Playlist.add = function (track) {
      var result = origAdd(track);
      if (track && window.Toast) {
        Toast.show({
          icon: '🎵',
          title: 'Added to Playlist',
          message: track.title || 'Unknown Track',
          duration: 2500
        });
      }
      return result;
    };
  }

  /**
   * Fetch and render trending tracks.
   */
  function loadTrending() {
    var listEl = document.getElementById('trending-list');
    if (!listEl) return;

    if (!window.Api) {
      listEl.innerHTML = '<div class="winamp-trending-error">Unable to load trending tracks.</div>';
      return;
    }

    listEl.innerHTML = '<div class="xp-spinner">Loading...</div>';

    Api.fetchTrending()
      .then(function (items) {
        if (!items || items.length === 0) {
          listEl.innerHTML = '<div class="winamp-trending-empty">No trending tracks yet. Be the first!</div>';
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          html += '<div class="winamp-trending-item" data-video-id="' + escapeHtml(item.videoId || '') + '" data-title="' + escapeHtml(item.title || '') + '" data-url="' + escapeHtml(item.url || '') + '">';
          html += '<span class="winamp-trending-item-title">' + escapeHtml(item.title || 'Unknown') + '</span>';
          html += '<span class="winamp-trending-item-count">' + (item.playCount || 0) + ' plays</span>';
          html += '</div>';
        }
        listEl.innerHTML = html;

        // Attach click handlers
        var trendItems = listEl.querySelectorAll('.winamp-trending-item');
        for (var j = 0; j < trendItems.length; j++) {
          (function (el) {
            var track = {
              videoId: el.getAttribute('data-video-id'),
              title: el.getAttribute('data-title'),
              url: el.getAttribute('data-url')
            };
            bindTrendingClick(el, track);
          })(trendItems[j]);
        }
      })
      .catch(function () {
        listEl.innerHTML = '<div class="winamp-trending-error">Unable to load trending tracks.</div>';
      });
  }

  // ---- Initialize on DOM ready ----
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize desktop shell
    if (window.Desktop) {
      Desktop.initWallpaper();
      Desktop.initContextmenu();
      Desktop.initIcons();
    }

    // Initialize taskbar
    if (window.Taskbar) {
      Taskbar.init();
    }

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Hook playlist add to show toasts
    hookPlaylistToast();

    // Restore now-playing widget if previously visible
    try {
      if (localStorage.getItem('np-widget-visible') === '1' && window.NowPlayingWidget) {
        NowPlayingWidget.toggle(true);
      }
    } catch (e) { /* ignore */ }

    // Register the Winamp window
    if (window.WindowManager) {
      WindowManager.register('winamp', function () {
        return {
          title: '⚡ Winamp',
          x: 80,
          y: 40,
          width: 420,
          height: 480,
          content: function (body) {
            buildWinampContent(body);
          }
        };
      });

      // Register the VLC player window
      WindowManager.register('vlc', function () {
        return {
          title: '\u{1F3AC} VLC media player',
          x: 120,
          y: 60,
          width: 560,
          height: 420,
          content: function (body) {
            body.style.padding = '0';
            body.style.overflow = 'hidden';
            if (window.VlcPlayer) {
              VlcPlayer.buildVlcContent(body);
            }
          }
        };
      });

      // Register the standalone Trending window
      WindowManager.register('trending', function () {
        return {
          title: '\u{1F525} Trending',
          x: '200px',
          y: '100px',
          width: '380px',
          height: '400px',
          content: async function (body) {
            body.style.padding = '0';
            body.innerHTML = '<div class="xp-spinner">Loading trending...</div>';
            try {
              var tracks = await Api.fetchTrending();
              if (tracks.length === 0) {
                body.innerHTML =
                  '<div style="padding:32px 16px;text-align:center;font-family:Tahoma,sans-serif;">' +
                  '<div style="font-size:48px;margin-bottom:12px;">\u{1F3B5}</div>' +
                  '<div style="color:#555;font-size:13px;">No trending tracks yet.</div>' +
                  '<div style="color:#999;font-size:11px;margin-top:6px;">Be the first to play some music!</div>' +
                  '</div>';
                return;
              }
              var html = '<div class="trending-window-list">';
              for (var i = 0; i < tracks.length; i++) {
                var t = tracks[i];
                html += '<div class="trending-window-item" data-video-id="' + escapeHtml(t.videoId) + '" data-title="' + escapeHtml(t.title) + '">';
                html += '<span class="trending-rank">' + (i + 1) + '.</span>';
                html += '<span class="trending-title">' + escapeHtml(t.title) + '</span>';
                html += '<span class="trending-count">' + t.playCount + 'x</span>';
                html += '</div>';
              }
              html += '</div>';
              body.innerHTML = html;

              body.querySelectorAll('.trending-window-item').forEach(function (el) {
                bindTrendingClick(el, { videoId: el.dataset.videoId, title: el.dataset.title });
              });
            } catch (e) {
              body.innerHTML = '<div style="padding:20px 16px;color:#c00;font-size:12px;font-family:Tahoma,sans-serif;">Unable to load trending tracks.</div>';
            }
          }
        };
      });
    }
  });
})();

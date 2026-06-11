/**
 * Player - YouTube iframe API integration and playback control
 * Task 10: Winamp Classic player with YouTube integration
 */
window.Player = (function () {
  'use strict';

  // Internal state
  var state = {
    currentTrack: null,
    isPlaying: false,
    volume: 80,
    elapsed: 0,
    duration: 0
  };

  var ytPlayer = null;
  var onTrackEndCallback = null;
  var spectrumInterval = null;
  var timeInterval = null;
  var spectrumBars = null;

  // YouTube iframe API ready callback (called by YouTube's script)
  window.onYouTubeIframeAPIReady = function () {
    // No-op — player is created on demand in createYouTubePlayer
  };

  /**
   * Format seconds to "MM:SS"
   * @param {number} seconds
   * @returns {string}
   */
  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds) || seconds < 0) return '00:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    var mm = mins < 10 ? '0' + mins : '' + mins;
    var ss = secs < 10 ? '0' + secs : '' + secs;
    return mm + ':' + ss;
  }

  /**
   * Update the display elements (time, track name, info).
   */
  function updateDisplay() {
    var timeEl = document.querySelector('.winamp-time');
    var nameEl = document.querySelector('.winamp-track-name');
    var infoEl = document.querySelector('.winamp-info');

    if (timeEl) {
      timeEl.textContent = formatTime(state.elapsed) + ' / ' + formatTime(state.duration);
    }

    if (nameEl && state.currentTrack) {
      var title = state.currentTrack.title || 'Unknown Track';
      nameEl.textContent = title;
      // Add scrolling class if the title is wider than the container
      if (title.length > 35) {
        nameEl.classList.add('scrolling');
      } else {
        nameEl.classList.remove('scrolling');
      }
    } else if (nameEl) {
      nameEl.textContent = '';
      nameEl.classList.remove('scrolling');
    }

    if (infoEl) {
      if (state.isPlaying && state.currentTrack) {
        infoEl.textContent = '128kbps 44kHz';
      } else {
        infoEl.textContent = 'Stopped';
      }
    }

    // Update seek slider
    var seekSlider = document.querySelector('.winamp-seek input[type="range"]');
    if (seekSlider) {
      var pct = state.duration > 0 ? (state.elapsed / state.duration) * 100 : 0;
      seekSlider.value = pct;
      seekSlider.style.setProperty('--seek-pct', pct + '%');
    }

    // Update volume slider fill
    var volumeSlider = document.querySelector('.winamp-volume-slider');
    if (volumeSlider) {
      volumeSlider.style.setProperty('--vol-pct', state.volume + '%');
    }

    // Update volume icon
    updateVolumeIcon();

    // Update play/pause button visual
    var playBtn = document.querySelector('.winamp-btn-play');
    if (playBtn) {
      if (state.isPlaying) {
        playBtn.textContent = '||';
        playBtn.classList.add('playing');
      } else {
        playBtn.textContent = '>';
        playBtn.classList.remove('playing');
      }
    }

    // Update video area glow
    var videoArea = document.querySelector('.winamp-video-area');
    if (videoArea) {
      if (state.isPlaying) {
        videoArea.classList.add('playing');
      } else {
        videoArea.classList.remove('playing');
      }
    }

    // Update now-playing widget if it exists
    if (window.NowPlayingWidget) {
      NowPlayingWidget.update(state);
    }
  }

  /**
   * Update volume icon based on current level.
   */
  function updateVolumeIcon() {
    var iconEl = document.querySelector('.winamp-volume-icon');
    if (!iconEl) return;

    iconEl.classList.remove('muted');
    if (state.volume === 0) {
      iconEl.textContent = '\u{1F507}';
      iconEl.classList.add('muted');
    } else if (state.volume < 30) {
      iconEl.textContent = '\u{1F509}';
    } else if (state.volume < 70) {
      iconEl.textContent = '\u{1F50A}';
    } else {
      iconEl.textContent = '\u{1F50A}';
    }
  }

  /**
   * Toggle mute/unmute.
   */
  var savedVolume = 80;

  function toggleMute() {
    if (state.volume > 0) {
      savedVolume = state.volume;
      setVolume(0);
    } else {
      setVolume(savedVolume);
    }
  }

  /**
   * Start spectrum animation — randomize bar heights every 150ms.
   */
  function startSpectrum() {
    if (spectrumInterval) return;
    spectrumBars = document.querySelectorAll('.winamp-spectrum-bar');
    var spectrumContainer = document.querySelector('.winamp-spectrum');
    if (spectrumContainer) {
      spectrumContainer.classList.remove('paused');
    }

    spectrumInterval = setInterval(function () {
      for (var i = 0; i < spectrumBars.length; i++) {
        var h = Math.random() * 22 + 2;
        spectrumBars[i].style.height = h + 'px';
      }
    }, 150);
  }

  /**
   * Stop spectrum animation.
   */
  function stopSpectrum() {
    if (spectrumInterval) {
      clearInterval(spectrumInterval);
      spectrumInterval = null;
    }
    var spectrumContainer = document.querySelector('.winamp-spectrum');
    if (spectrumContainer) {
      spectrumContainer.classList.add('paused');
    }
  }

  /**
   * Start tracking elapsed time.
   */
  function startTimer() {
    if (timeInterval) return;
    timeInterval = setInterval(function () {
      if (state.isPlaying && ytPlayer) {
        state.elapsed = ytPlayer.getCurrentTime() || 0;
        // Duration may not be available immediately — keep refreshing
        var dur = ytPlayer.getDuration();
        if (dur && dur > 0) state.duration = dur;
        updateDisplay();
      }
    }, 500);
  }

  /**
   * Stop tracking elapsed time.
   */
  function stopTimer() {
    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }
  }

  /**
   * Highlight the active playlist item.
   */
  function highlightPlaylistItem() {
    var items = document.querySelectorAll('.winamp-playlist-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('active');
    }
    // Find the currently playing track's index from Playlist
    if (window.Playlist && Playlist.getActiveIndex != null) {
      var idx = Playlist.getActiveIndex();
      if (idx >= 0 && items[idx]) {
        items[idx].classList.add('active');
      }
    }
  }

  /**
   * Create a YouTube player inside the given container.
   * @param {HTMLElement} container - element with class .winamp-video-area
   * @param {string} videoId - YouTube video ID
   */
  function createYouTubePlayer(container, videoId) {
    // Destroy existing player
    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch (e) { /* ignore */ }
      ytPlayer = null;
    }

    // Clear container and create the player div
    container.innerHTML = '';
    var playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player';
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    container.appendChild(playerDiv);

    // Check if YT API is ready
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      container.innerHTML = '<div class="winamp-video-placeholder">YouTube API not loaded</div>';
      if (window.Dialog) {
        Dialog.showError('Player Error', 'YouTube API failed to load. Please refresh the page.');
      }
      return;
    }

    ytPlayer = new YT.Player('yt-player', {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: function (event) {
          event.target.setVolume(state.volume);
          event.target.playVideo();
          state.isPlaying = true;
          state.duration = ytPlayer.getDuration() || 0;
          state.elapsed = 0;
          startSpectrum();
          startTimer();
          updateDisplay();
          highlightPlaylistItem();
        },
        onStateChange: function (event) {
          // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
          if (event.data === YT.PlayerState.PLAYING) {
            state.isPlaying = true;
            state.duration = ytPlayer.getDuration() || 0;
            startSpectrum();
            startTimer();
          } else if (event.data === YT.PlayerState.PAUSED) {
            state.isPlaying = false;
            stopSpectrum();
          } else if (event.data === YT.PlayerState.ENDED) {
            state.isPlaying = false;
            state.elapsed = 0;
            stopSpectrum();
            stopTimer();
            updateDisplay();
            if (typeof onTrackEndCallback === 'function') {
              onTrackEndCallback();
            }
          } else if (event.data === YT.PlayerState.BUFFERING) {
            // Duration often becomes available during buffering
            var dur = ytPlayer.getDuration();
            if (dur && dur > 0) state.duration = dur;
          }
          updateDisplay();
        },
        onError: function (event) {
          state.isPlaying = false;
          stopSpectrum();
          stopTimer();
          updateDisplay();

          var errorMsg = 'Unknown playback error.';
          if (event.data === 150 || event.data === 101) {
            errorMsg = 'This video cannot be embedded (error ' + event.data + ').';
          } else if (event.data === 2) {
            errorMsg = 'Invalid video ID.';
          } else if (event.data === 5) {
            errorMsg = 'HTML5 player error. Try refreshing.';
          } else if (event.data === 100) {
            errorMsg = 'Video not found or private.';
          }

          if (window.Dialog) {
            Dialog.showError('Playback Error', errorMsg);
          }

          // Mark track as unplayable
          if (window.Playlist && state.currentTrack) {
            Playlist.markUnplayable(state.currentTrack.videoId);
          }
        }
      }
    });
  }

  /**
   * Play a track.
   * @param {Object} track - { videoId, title, url }
   */
  /**
   * Play a track.
   * @param {Object} track - { videoId, title, url }
   * @param {HTMLElement} [container] - Optional video container. Defaults to .winamp-video-area
   */
  function play(track, container) {
    if (!track) return;

    state.currentTrack = track;
    state.isPlaying = false;
    state.elapsed = 0;
    state.duration = 0;

    var videoArea = container || document.querySelector('.winamp-video-area');
    if (!videoArea) return;

    createYouTubePlayer(videoArea, track.videoId);

    // Record the play
    if (window.Api && track.videoId) {
      Api.recordPlay(track.videoId);
    }

    updateDisplay();
    highlightPlaylistItem();
  }

  /**
   * Pause playback.
   */
  function pause() {
    if (ytPlayer && state.isPlaying) {
      ytPlayer.pauseVideo();
      state.isPlaying = false;
      stopSpectrum();
      updateDisplay();
    }
  }

  /**
   * Resume playback.
   */
  function resume() {
    if (ytPlayer && !state.isPlaying) {
      ytPlayer.playVideo();
      state.isPlaying = true;
      startSpectrum();
      startTimer();
      updateDisplay();
    }
  }

  /**
   * Stop playback.
   */
  function stop() {
    if (ytPlayer) {
      ytPlayer.stopVideo();
    }
    state.isPlaying = false;
    state.elapsed = 0;
    stopSpectrum();
    stopTimer();
    updateDisplay();
  }

  /**
   * Seek to a position in seconds.
   * @param {number} seconds
   */
  function seekTo(seconds) {
    if (ytPlayer && isFinite(seconds) && seconds >= 0) {
      ytPlayer.seekTo(seconds, true);
      state.elapsed = seconds;
      updateDisplay();
    }
  }

  /**
   * Set volume (0-100).
   * @param {number} val
   */
  function setVolume(val) {
    state.volume = Math.max(0, Math.min(100, val));
    if (ytPlayer) {
      ytPlayer.setVolume(state.volume);
    }
  }

  /**
   * Set callback for when track ends.
   * @param {function} cb
   */
  function setTrackEndCallback(cb) {
    onTrackEndCallback = cb;
  }

  /**
   * Get a copy of the current state.
   * @returns {Object}
   */
  function getState() {
    return {
      currentTrack: state.currentTrack,
      isPlaying: state.isPlaying,
      volume: state.volume,
      elapsed: state.elapsed,
      duration: state.duration
    };
  }

  // Public API
  return {
    play: play,
    pause: pause,
    resume: resume,
    stop: stop,
    seekTo: seekTo,
    setVolume: setVolume,
    toggleMute: toggleMute,
    setTrackEndCallback: setTrackEndCallback,
    getState: getState,
    formatTime: formatTime,
    updateDisplay: updateDisplay
  };
})();

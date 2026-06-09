/**
 * Playlist - Playlist state management
 * Task 10: Winamp Classic playlist panel
 */
window.Playlist = (function () {
  'use strict';

  var tracks = [];
  var activeIndex = -1;
  var selectedIndex = -1;

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
   * Add a track to the playlist.
   * @param {Object} track - { videoId, title, url }
   */
  function add(track) {
    if (!track) return;

    // Check for duplicates by videoId
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].videoId === track.videoId) {
        // Already in playlist, just play it
        playIndex(i);
        return;
      }
    }

    tracks.push(track);
    renderPlaylist();

    // Auto-play first track if nothing playing
    if (window.Player && !Player.getState().currentTrack) {
      playIndex(0);
    }
  }

  /**
   * Remove the selected track from the playlist.
   */
  function removeSelected() {
    if (selectedIndex < 0 || selectedIndex >= tracks.length) return;

    var removedIndex = selectedIndex;
    tracks.splice(removedIndex, 1);

    // Adjust indices
    if (tracks.length === 0) {
      activeIndex = -1;
      selectedIndex = -1;
    } else {
      if (activeIndex === removedIndex) {
        activeIndex = -1;
      } else if (activeIndex > removedIndex) {
        activeIndex--;
      }
      if (selectedIndex >= tracks.length) {
        selectedIndex = tracks.length - 1;
      }
    }

    renderPlaylist();
  }

  /**
   * Play the track at the given index.
   * @param {number} index
   */
  function playIndex(index) {
    if (index < 0 || index >= tracks.length) return;

    var track = tracks[index];
    if (track.unplayable) return;

    activeIndex = index;
    selectedIndex = index;

    renderPlaylist();

    if (window.Player) {
      Player.play(track);
    }
  }

  /**
   * Play the next track.
   * @param {boolean} shuffle
   * @param {boolean} repeat
   */
  function playNext(shuffle, repeat) {
    if (tracks.length === 0) return;

    // Find next playable track (skip unplayable ones)
    if (shuffle) {
      // Random track, but try to avoid current
      var playableIndices = [];
      for (var i = 0; i < tracks.length; i++) {
        if (!tracks[i].unplayable) playableIndices.push(i);
      }
      if (playableIndices.length === 0) return;
      var rand = playableIndices[Math.floor(Math.random() * playableIndices.length)];
      playIndex(rand);
    } else {
      var next = activeIndex + 1;
      if (next >= tracks.length) {
        if (repeat) {
          next = 0;
          // Skip unplayable at start
          while (next < tracks.length && tracks[next].unplayable) next++;
          if (next >= tracks.length) return;
        } else {
          return; // Stop at end
        }
      }
      if (!tracks[next].unplayable) {
        playIndex(next);
      } else {
        // Skip unplayable tracks
        activeIndex = next;
        playNext(false, repeat);
      }
    }
  }

  /**
   * Play the previous track.
   */
  function playPrev() {
    if (activeIndex > 0) {
      playIndex(activeIndex - 1);
    } else if (activeIndex === 0) {
      playIndex(0);
    }
  }

  /**
   * Get the first track, or null if empty.
   * @returns {Object|null}
   */
  function getFirst() {
    return tracks.length > 0 ? tracks[0] : null;
  }

  /**
   * Get the active index.
   * @returns {number}
   */
  function getActiveIndex() {
    return activeIndex;
  }

  /**
   * Get all tracks.
   * @returns {Array}
   */
  function getTracks() {
    return tracks;
  }

  /**
   * Mark a track as unplayable.
   * @param {string} videoId
   */
  function markUnplayable(videoId) {
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].videoId === videoId) {
        tracks[i].unplayable = true;
        break;
      }
    }
    renderPlaylist();
  }

  /**
   * Render the playlist UI from the tracks array.
   */
  function renderPlaylist() {
    var listEl = document.querySelector('.winamp-playlist-list');
    if (!listEl) return;

    if (tracks.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    var html = '';
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var classes = 'winamp-playlist-item';
      if (i === activeIndex) classes += ' active';
      if (t.unplayable) classes += ' unplayable';

      html += '<div class="' + classes + '" data-index="' + i + '">';
      html += '<span class="winamp-playlist-item-num">' + (i + 1) + '</span>';
      html += '<span class="winamp-playlist-item-text">' + escapeHtml(t.title || 'Unknown') + '</span>';
      html += '</div>';
    }
    listEl.innerHTML = html;

    // Attach click handlers
    var items = listEl.querySelectorAll('.winamp-playlist-item');
    for (var j = 0; j < items.length; j++) {
      (function (idx) {
        items[idx].addEventListener('click', function () {
          selectedIndex = idx;
          if (!tracks[idx].unplayable) {
            playIndex(idx);
          }
        });
      })(j);
    }
  }

  // Public API
  return {
    add: add,
    removeSelected: removeSelected,
    playIndex: playIndex,
    playNext: playNext,
    playPrev: playPrev,
    getFirst: getFirst,
    getActiveIndex: getActiveIndex,
    getTracks: getTracks,
    markUnplayable: markUnplayable,
    renderPlaylist: renderPlaylist
  };
})();

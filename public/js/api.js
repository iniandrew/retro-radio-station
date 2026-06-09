;(function () {
  'use strict';

  const BASE = '/api';

  /**
   * Resolve a track URL to metadata via the backend.
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async function resolveTrack(url) {
    const res = await fetch(`${BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Track resolution failed (${res.status})`);
    }

    return res.json();
  }

  /**
   * Record a play event for a video. Silently swallows errors.
   * @param {string} videoId
   */
  async function recordPlay(videoId) {
    try {
      await fetch(`${BASE}/track/${videoId}/play`, { method: 'POST' });
    } catch (_) {
      // Intentional: playback must never break if tracking is down.
    }
  }

  /**
   * Fetch trending tracks.
   * @returns {Promise<Array>}
   */
  async function fetchTrending() {
    const res = await fetch(`${BASE}/trending`);

    if (!res.ok) {
      throw new Error(`Failed to fetch trending tracks (${res.status})`);
    }

    return res.json();
  }

  window.Api = { resolveTrack, recordPlay, fetchTrending };
})();

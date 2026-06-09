let redis = null;
try {
  const { Redis } = require('@upstash/redis');
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.warn('Upstash Redis not available — trending disabled');
}

async function getTracks() {
  if (!redis) return [];
  try { return JSON.parse(await redis.get('trending') || '[]'); }
  catch { return []; }
}

async function saveTracks(tracks) {
  if (!redis) return;
  await redis.set('trending', JSON.stringify(tracks));
}

function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing required field: url' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return res.status(404).json({ error: 'Video not found or oEmbed unavailable' });
    }
    const data = await response.json();
    const title = data.title || 'Unknown Title';
    const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    // Upsert track in trending store
    const tracks = await getTracks();
    const existing = tracks.find(t => t.videoId === videoId);
    if (existing) {
      existing.title = title;
      existing.thumbnail = thumbnail;
    } else {
      tracks.push({ videoId, title, thumbnail, playCount: 0, lastPlayed: null });
    }
    await saveTracks(tracks);

    res.json({ videoId, title, thumbnail });
  } catch (err) {
    console.error('oEmbed fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
};

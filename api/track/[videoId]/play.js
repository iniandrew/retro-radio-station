const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    let tracks = [];
    try { tracks = JSON.parse(await redis.get('trending') || '[]'); } catch { tracks = []; }
    const track = tracks.find(t => t.videoId === videoId);

    if (track) {
      track.playCount = (track.playCount || 0) + 1;
      track.lastPlayed = new Date().toISOString();
    } else {
      tracks.push({
        videoId,
        title: '',
        thumbnail: '',
        playCount: 1,
        lastPlayed: new Date().toISOString()
      });
    }

    await redis.set('trending', JSON.stringify(tracks));
    res.json({ success: true });
  } catch (err) {
    console.error('Redis write failed:', err);
    res.status(500).json({ error: 'Failed to record play' });
  }
};

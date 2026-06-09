const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let tracks = [];
    try { tracks = JSON.parse(await redis.get('trending') || '[]'); } catch { tracks = []; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = tracks
      .filter(t => t.lastPlayed && new Date(t.lastPlayed) >= sevenDaysAgo)
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 20)
      .map(({ videoId, title, thumbnail, playCount }) => ({
        videoId,
        title,
        thumbnail,
        playCount,
      }));

    res.json(trending);
  } catch (err) {
    console.error('Redis read failed:', err);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
};

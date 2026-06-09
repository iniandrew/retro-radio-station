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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let tracks = [];
    if (redis) {
      try { tracks = JSON.parse(await redis.get('trending') || '[]'); } catch { tracks = []; }
    }

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
    console.error('Trending fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
};

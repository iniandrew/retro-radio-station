const express = require('express');
const path = require('path');
const { upsertTrack, recordPlay, getTrending, getTrack } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

app.post('/api/track', async (req, res) => {
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

    upsertTrack(videoId, title, thumbnail);

    res.json({ videoId, title, thumbnail });
  } catch (err) {
    console.error('Error fetching oEmbed:', err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.post('/api/track/:videoId/play', (req, res) => {
  const { videoId } = req.params;
  recordPlay(videoId);
  res.json({ success: true });
});

app.get('/api/trending', (req, res) => {
  const tracks = getTrending(20);
  res.json(tracks);
});

app.listen(PORT, () => {
  console.log(`RetroBox running at http://localhost:${PORT}`);
});

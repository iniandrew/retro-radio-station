# 🎵 Retro Radio Station

A nostalgia-driven web radio station themed as a **Windows XP desktop** with a pixel-perfect **Winamp Classic** media player. Paste YouTube URLs to discover and play old music.

![Windows XP](https://img.shields.io/badge/Theme-Windows%20XP-0078D4?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-F7DF1E?style=flat-square)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square)

## Features

- **Windows XP Desktop Shell** — full desktop experience with wallpaper, icons, taskbar, draggable windows, and right-click context menu
- **Winamp Classic Player** — dark skin with LED display, spectrum analyzer, transport controls, volume/seek sliders
- **YouTube Playback** — paste any YouTube URL, plays in a mini video window inside the player
- **Per-Session Playlist** — build your own playlist, reorder, remove tracks
- **Trending System** — tracks play counts across sessions, shows what's popular
- **Wallpaper Switching** — right-click desktop to switch between XP Bliss and Windows 7 Aurora
- **XP Dialogs** — all prompts and errors use authentic Windows XP dialog styling

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Double-click "My Music"** on the desktop to open the Winamp player
2. **Click "Eject" or "+Add"** to paste a YouTube URL
3. **Use transport controls** — play, pause, stop, next, previous
4. **Toggle shuffle/repeat** for extended listening
5. **Check trending** — click the "🔥 Trending" panel in the playlist, or double-click the "Trending" desktop icon
6. **Single-click** a trending track to add it to your playlist
7. **Double-click** a trending track to add and play it immediately
8. **Right-click the desktop** to change wallpaper

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Backend | Node.js + Express (local) / Vercel Serverless Functions (production) |
| Database | SQLite via better-sqlite3 (local) / Upstash Redis (production) |
| Video | YouTube iframe API + oEmbed API |

## Project Structure

```
media-players/
├── server.js              # Express server + API endpoints (local dev)
├── db.js                  # SQLite database module (local dev)
├── vercel.json             # Vercel deployment config
├── api/                   # Vercel serverless functions (production)
│   ├── track.js           # POST /api/track — resolve YouTube URL
│   ├── trending.js        # GET /api/trending — get top tracks
│   └── track/
│       └── [videoId]/
│           └── play.js    # POST /api/track/:videoId/play — record play
├── public/                 # Static frontend files
│   ├── index.html
│   ├── css/
│   │   ├── desktop.css
│   │   ├── window.css
│   │   ├── winamp.css
│   │   └── playlist.css
│   └── js/
│       ├── app.js
│       ├── desktop.js
│       ├── taskbar.js
│       ├── window-manager.js
│       ├── dialog.js
│       ├── player.js
│       ├── playlist.js
│       └── api.js
├── data/                   # SQLite database (local only, gitignored)
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/track` | Resolve YouTube URL to metadata |
| `POST` | `/api/track/:videoId/play` | Record a play event |
| `GET` | `/api/trending` | Get top 20 trending tracks |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (local dev only) |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis REST URL (set by Vercel) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis REST token (set by Vercel) |

## Deployment

### Vercel (recommended)

Full stack — player, playlist, and trending all work.

1. Push repo to GitHub
2. Import on [vercel.com](https://vercel.com) — auto-detects config
3. Vercel dashboard → **Storage** → add **Upstash Redis** (free tier)
4. Redeploy — env vars auto-set, trending works

```bash
# Local dev still uses Express + SQLite (no Redis needed)
npm start

# Deploy to Vercel
vercel
```

### Local Development

```bash
npm install
npm start
```

Uses Express + SQLite. No Redis or Vercel needed.

## License

MIT

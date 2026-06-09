# 🎵 Retro Radio Station

A nostalgia-driven web radio station themed as a **Windows XP desktop** with a pixel-perfect **Winamp Classic** media player. Paste YouTube URLs to discover and play old music.

![Windows XP](https://img.shields.io/badge/Theme-Windows%20XP-0078D4?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-F7DF1E?style=flat-square)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square)

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
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Video | YouTube iframe API + oEmbed API |

## Project Structure

```
media-players/
├── server.js              # Express server + API endpoints
├── db.js                  # SQLite database module
├── package.json
├── public/
│   ├── index.html         # Desktop shell
│   ├── css/
│   │   ├── desktop.css    # Wallpaper, icons, taskbar, context menu
│   │   ├── window.css     # Window manager + XP dialog styles
│   │   ├── winamp.css     # Winamp Classic player skin
│   │   └── playlist.css   # Playlist panel + trending styles
│   └── js/
│       ├── app.js         # Entry point, wires everything together
│       ├── desktop.js     # Desktop icons, wallpaper, context menu
│       ├── taskbar.js     # Taskbar with clock and window tabs
│       ├── window-manager.js  # Draggable/min/max/close windows
│       ├── dialog.js      # XP-style dialog boxes
│       ├── player.js     # YouTube iframe API integration
│       ├── playlist.js    # Playlist state management
│       └── api.js         # Backend API client
├── data/                  # SQLite database (gitignored)
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
| `PORT` | `3000` | Server port |

## Deployment

### GitHub Pages (frontend only)

Push to `main` to auto-deploy. The workflow copies `public/` to GitHub Pages.

> **Note:** GitHub Pages serves static files only. The player and playlist work. The trending feature requires the Express backend — use a hosting platform that supports Node.js for the full experience.

### Full stack (with trending)

Deploy to any Node.js host — [Render](https://render.com), [Railway](https://railway.app), [Vercel](https://vercel.com), [Fly.io](https://fly.io), etc.

```bash
npm install
npm start    # or npm run dev for hot reload
```

## License

MIT

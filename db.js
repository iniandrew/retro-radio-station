const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'trending.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tracks (
    videoId TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail TEXT,
    playCount INTEGER DEFAULT 0,
    lastPlayed TEXT
  )
`);

function upsertTrack(videoId, title, thumbnail) {
  const stmt = db.prepare(`
    INSERT INTO tracks (videoId, title, thumbnail)
    VALUES (?, ?, ?)
    ON CONFLICT(videoId) DO UPDATE SET
      title = excluded.title,
      thumbnail = excluded.thumbnail
  `);
  stmt.run(videoId, title, thumbnail);
}

function recordPlay(videoId) {
  const stmt = db.prepare(`
    INSERT INTO tracks (videoId, title, playCount, lastPlayed)
    VALUES (?, '', 1, datetime('now'))
    ON CONFLICT(videoId) DO UPDATE SET
      playCount = playCount + 1,
      lastPlayed = datetime('now')
  `);
  stmt.run(videoId);
}

function getTrending(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM tracks
    WHERE lastPlayed >= datetime('now', '-7 days')
    ORDER BY playCount DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function getTrack(videoId) {
  const stmt = db.prepare('SELECT * FROM tracks WHERE videoId = ?');
  return stmt.get(videoId);
}

module.exports = { db, upsertTrack, recordPlay, getTrending, getTrack };

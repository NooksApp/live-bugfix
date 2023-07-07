const sqlite3 = require("sqlite3").verbose();
// data can be lost when storing in memeory, but for the sake of demo, let's simplify this with memory store
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  // it's actually better called session, probably a bad naming :(
  db.run(`CREATE TABLE videos (
    id TEXT PRIMARY KEY,
    url TEXT,
    isSessionEnd BOOLEAN DEFAULT 0,
    createdAt INTEGER DEFAULT (CAST((strftime('%s', 'now') || substr(strftime('%f', 'now'), 4, 4)) AS INTEGER)),
    updatedAt INTEGER DEFAULT (CAST((strftime('%s', 'now') || substr(strftime('%f', 'now'), 4, 4)) AS INTEGER))
  )`);

  db.run(`CREATE TABLE videoControls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    videoId TEXT,
    type TEXT CHECK (type IN ("PLAY", "PAUSE", "END")),
    progress REAL CHECK (progress >= 0.0 AND progress <= 0.999999),
    createdAt INTEGER DEFAULT (CAST((strftime('%s', 'now') || substr(strftime('%f', 'now'), 4, 4)) AS INTEGER)),
    FOREIGN KEY(videoId) REFERENCES videos(id)
  )`);
});

module.exports = {
  getVideo: (videoId) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM videos WHERE id = ?", [videoId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  createNewVideo: (videoId, url) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO videos (id, url) VALUES (?, ?)", [videoId, url], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },

  markVideoEnd: (videoId) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE videos SET isSessionEnd = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [videoId],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  },

  createVideoControl: (videoId, type, progress) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO videoControls (videoId, type, progress) VALUES (?, ?, ?)",
        [videoId, type, progress],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  },

  getLastVideoControl: (videoId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM videoControls WHERE videoId = ? ORDER BY id DESC LIMIT 1",
        [videoId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
  },

  getAllVideoControls: (videoId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM videoControls WHERE videoId = ? ORDER BY createdAt",
        [videoId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },
};

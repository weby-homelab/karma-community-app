const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, 'karma.db'),
      driver: sqlite3.Database
    }).then(async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          username TEXT,
          first_name TEXT,
          karma INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS messages (
          message_id INTEGER,
          chat_id INTEGER,
          user_id INTEGER,
          PRIMARY KEY (message_id, chat_id)
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb };
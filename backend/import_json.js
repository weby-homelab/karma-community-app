const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

const VALID_EMOJIS = ['🔥', '❤️', '❤', '👍', '👏', '🏆', '💯', '⚡', '⚡️'];

async function importData() {
  console.log('Loading result-5.json...');
  const jsonPath = path.join(__dirname, '../result-5.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('File result-5.json not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);
  const messages = data.messages || [];
  
  console.log(`Found ${messages.length} messages. Processing...`);
  
  const db = await getDb();
  
  // Store user karma locally before bulk insert to save time
  const userMap = new Map(); // id -> { username, first_name, karma }

  for (const msg of messages) {
    if (!msg.from_id || typeof msg.from_id !== 'string') {
      continue;
    }
    
    let userId;
    if (msg.from_id.startsWith('user')) {
      userId = parseInt(msg.from_id.substring(4), 10);
    } else if (msg.from_id.startsWith('channel')) {
      userId = parseInt(msg.from_id.substring(7), 10);
    } else {
      continue;
    }
    const firstName = msg.from || 'Unknown';
    let karmaToAdd = 0;
    
    if (msg.reactions && Array.isArray(msg.reactions)) {
      for (const reaction of msg.reactions) {
        if (reaction.type === 'emoji' && VALID_EMOJIS.includes(reaction.emoji)) {
          karmaToAdd += reaction.count || 1;
        }
      }
    }
    
    if (!userMap.has(userId)) {
      userMap.set(userId, { id: userId, first_name: firstName, username: '', karma: 0 });
    }
    
    if (karmaToAdd > 0) {
      const u = userMap.get(userId);
      u.karma += karmaToAdd;
      // Also update latest first_name if available
      u.first_name = firstName;
    }
  }
  
  console.log('Clearing old data from DB...');
  await db.exec('DELETE FROM users;');
  await db.exec('DELETE FROM messages;');

  console.log(`Inserting ${userMap.size} users into DB...`);
  
  await db.exec('BEGIN TRANSACTION');
  const stmt = await db.prepare(
    `INSERT INTO users (id, username, first_name, karma) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET first_name=excluded.first_name, karma=users.karma + excluded.karma`
  );
  
  for (const u of userMap.values()) {
    if (u.karma > 0) {
      await stmt.run([u.id, u.username, u.first_name, u.karma]);
    }
  }
  
  await stmt.finalize();
  await db.exec('COMMIT');
  
  console.log('Import completed successfully!');
}

importData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
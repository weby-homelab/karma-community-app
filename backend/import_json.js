const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');
const { updateSettings } = require('./settings');

const FLOODER_EMOJIS = ['😁', '🤣', '🤪'];
const GURU_EMOJIS = ['🔥', '👍', '💯', '🤝', '🫡', '❤️', '❤', '❤️🔥', '👌', '😎'];
const SKEPTIC_EMOJIS = ['🤔', '👀', '🤷‍♂️', '🤷\u200d♂️', '🤷', '🤯', '😱', '👎', '😢', '🙈', '🥴'];
const VALID_EMOJIS = [...FLOODER_EMOJIS, ...GURU_EMOJIS, ...SKEPTIC_EMOJIS];

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
  const userMap = new Map();

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
    const msgDate = parseInt(msg.date_unixtime || '9999999999', 10);
    let karmaToAdd = 0;
    let flooderToAdd = 0;
    let guruToAdd = 0;
    let skepticToAdd = 0;
    
    if (msg.reactions && Array.isArray(msg.reactions)) {
      for (const reaction of msg.reactions) {
        if (reaction.type === 'emoji') {
          const emoji = reaction.emoji;
          const count = reaction.count || 1;
          if (FLOODER_EMOJIS.includes(emoji)) {
            flooderToAdd += count;
            karmaToAdd += count;
          } else if (GURU_EMOJIS.includes(emoji)) {
            guruToAdd += count;
            karmaToAdd += count;
          } else if (SKEPTIC_EMOJIS.includes(emoji)) {
            skepticToAdd += count;
            karmaToAdd += count;
          }
        }
      }
    }
    
    if (!userMap.has(userId)) {
      userMap.set(userId, { 
        id: userId, 
        first_name: firstName, 
        username: '', 
        karma: 0, 
        karma_flooder: 0, 
        karma_guru: 0, 
        karma_skeptic: 0, 
        join_date: msgDate 
      });
    } else {
      const u = userMap.get(userId);
      if (msgDate < u.join_date) {
        u.join_date = msgDate;
      }
    }
    
    if (karmaToAdd > 0) {
      const u = userMap.get(userId);
      u.karma += karmaToAdd;
      u.karma_flooder += flooderToAdd;
      u.karma_guru += guruToAdd;
      u.karma_skeptic += skepticToAdd;
      u.first_name = firstName;
    }
  }
  
  console.log('Clearing old data and inserting users in atomic transaction...');
  
  await db.exec('BEGIN TRANSACTION');
  try {
    await db.exec('DELETE FROM users;');
    await db.exec('DELETE FROM messages;');
    
    const stmt = await db.prepare(
      `INSERT INTO users (id, username, first_name, karma, karma_flooder, karma_guru, karma_skeptic, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
         first_name=excluded.first_name, 
         karma=users.karma + excluded.karma,
         karma_flooder=users.karma_flooder + excluded.karma_flooder,
         karma_guru=users.karma_guru + excluded.karma_guru,
         karma_skeptic=users.karma_skeptic + excluded.karma_skeptic,
         join_date=MIN(users.join_date, excluded.join_date)`
    );
    
    for (const u of userMap.values()) {
      await stmt.run([u.id, u.username, u.first_name, u.karma, u.karma_flooder, u.karma_guru, u.karma_skeptic, u.join_date]);
    }
    
    await stmt.finalize();
    
    // Update last_update setting
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const formattedDate = formatter.format(now).replace(',', '').replace(/\s+/g, ' ').trim();
    await updateSettings({ last_update: formattedDate });
    
    await db.exec('COMMIT');
    console.log('Import completed successfully!');
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

importData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
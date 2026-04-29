const { Bot } = require('grammy');
const { getDb } = require('./db');
require('dotenv').config();

// Ensure BOT_TOKEN is set
if (!process.env.BOT_TOKEN) {
  console.warn("No BOT_TOKEN found in .env. Bot will use a dummy token and fail to start.");
}

const bot = new Bot(process.env.BOT_TOKEN || 'DUMMY_TOKEN');

// Helper to register user
async function registerUser(db, user) {
  if (!user || user.is_bot) return;
  await db.run(
    `INSERT INTO users (id, username, first_name) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name`,
    [user.id, user.username, user.first_name]
  );
}

// Track messages
bot.on('message', async (ctx) => {
  const db = await getDb();
  await registerUser(db, ctx.from);
  
  if (ctx.chat.type === 'supergroup' || ctx.chat.type === 'group') {
    await db.run(
      'INSERT OR IGNORE INTO messages (message_id, chat_id, user_id) VALUES (?, ?, ?)',
      [ctx.message.message_id, ctx.chat.id, ctx.from.id]
    );
  }
});

// Handle reactions
const VALID_EMOJIS = ['🔥', '❤️', '👍', '👏', '🏆', '💯', '⚡'];

bot.on('message_reaction', async (ctx) => {
  const reaction = ctx.messageReaction;
  const db = await getDb();
  
  const reactor = reaction.user;
  if (!reactor) return; // Anonymous reactor
  
  await registerUser(db, reactor);

  // Find original message author
  const msgRow = await db.get(
    'SELECT user_id FROM messages WHERE message_id = ? AND chat_id = ?',
    [reaction.message_id, reaction.chat.id]
  );
  
  if (!msgRow) return; // We don't have this message in DB
  const authorId = msgRow.user_id;
  
  if (authorId === reactor.id) return; // No self-karma

  // Calculate difference between old and new reactions
  const oldEmojis = reaction.old_reaction.filter(r => r.type === 'emoji').map(r => r.emoji);
  const newEmojis = reaction.new_reaction.filter(r => r.type === 'emoji').map(r => r.emoji);
  
  const added = newEmojis.filter(e => !oldEmojis.includes(e) && VALID_EMOJIS.includes(e));
  const removed = oldEmojis.filter(e => !newEmojis.includes(e) && VALID_EMOJIS.includes(e));
  
  let karmaDelta = added.length - removed.length;
  
  if (karmaDelta !== 0) {
    // Update user karma
    await db.run('UPDATE users SET karma = karma + ? WHERE id = ?', [karmaDelta, authorId]);
  }
});

module.exports = bot;
const { Bot } = require('grammy');
const { getDb } = require('./db');

let botInstance = null;

async function startBot(token, webAppUrl, targetChatId) {
  if (!token || token === 'DUMMY_TOKEN') {
    console.warn("No BOT_TOKEN provided. Bot will not start.");
    return;
  }

  const bot = new Bot(token);
  botInstance = bot;

  // Start command
  bot.command('start', async (ctx) => {
    const db = await getDb();
    await registerUser(db, ctx.from);
    
    await ctx.reply('Вітаємо у Karma Community! Натисніть кнопку нижче, щоб відкрити додаток.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Відкрити App', web_app: { url: webAppUrl } }]
        ]
      }
    });
  });

  // Track messages
  bot.on('message', async (ctx) => {
    const db = await getDb();
    await registerUser(db, ctx.from);
    
    if (ctx.chat.type === 'supergroup' || ctx.chat.type === 'group') {
      if (targetChatId && String(ctx.chat.id) !== String(targetChatId)) return;
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
    
    if (targetChatId && String(reaction.chat.id) !== String(targetChatId)) return;
    
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
      await db.run('UPDATE users SET karma = MAX(0, karma + ?) WHERE id = ?', [karmaDelta, authorId]);
    }
  });

  bot.start({
    allowed_updates: ["message", "message_reaction", "callback_query"],
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} started!`);
    }
  }).catch(err => console.error('Bot start error:', err));
}

// Helper to register user
async function registerUser(db, user) {
  if (!user || user.is_bot) return;
  await db.run(
    `INSERT INTO users (id, username, first_name) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name`,
    [user.id, user.username, user.first_name]
  );
}

module.exports = { startBot };
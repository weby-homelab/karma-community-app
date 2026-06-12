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
    if (!ctx.from) return;
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
  const FLOODER_EMOJIS = ['😁', '🤣', '🤪'];
  const GURU_EMOJIS = ['🔥', '👍', '💯', '🤝', '🫡', '❤️', '❤', '❤️🔥', '👌', '😎'];
  const SKEPTIC_EMOJIS = ['🤔', '👀', '🤷‍♂️', '🤷\u200d♂️', '🤷', '🤯', '😱', '👎', '😢', '🙈', '🥴'];
  const VALID_EMOJIS = [...FLOODER_EMOJIS, ...GURU_EMOJIS, ...SKEPTIC_EMOJIS];

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
    
    const flooderAdded = added.filter(e => FLOODER_EMOJIS.includes(e)).length;
    const flooderRemoved = removed.filter(e => FLOODER_EMOJIS.includes(e)).length;
    const flooderDelta = flooderAdded - flooderRemoved;

    const guruAdded = added.filter(e => GURU_EMOJIS.includes(e)).length;
    const guruRemoved = removed.filter(e => GURU_EMOJIS.includes(e)).length;
    const guruDelta = guruAdded - guruRemoved;

    const skepticAdded = added.filter(e => SKEPTIC_EMOJIS.includes(e)).length;
    const skepticRemoved = removed.filter(e => SKEPTIC_EMOJIS.includes(e)).length;
    const skepticDelta = skepticAdded - skepticRemoved;
    
    if (karmaDelta !== 0 || flooderDelta !== 0 || guruDelta !== 0 || skepticDelta !== 0) {
      // Update user karma and categories
      await db.run(
        `UPDATE users SET 
          karma = MAX(0, karma + ?),
          karma_flooder = MAX(0, karma_flooder + ?),
          karma_guru = MAX(0, karma_guru + ?),
          karma_skeptic = MAX(0, karma_skeptic + ?)
         WHERE id = ?`,
        [karmaDelta, flooderDelta, guruDelta, skepticDelta, authorId]
      );
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
    `INSERT INTO users (id, username, first_name, join_date) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET 
       username=excluded.username, 
       first_name=excluded.first_name,
       join_date=MIN(users.join_date, excluded.join_date)`,
    [user.id, user.username, user.first_name, Math.floor(Date.now() / 1000)]
  );
}

module.exports = { startBot };
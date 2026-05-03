require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { getDb } = require('./db');
const bot = require('./bot');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', (() => {
  const val = process.env.TRUST_PROXY;
  if (!val) return 1;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return isNaN(val) ? val : Number(val);
})());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use(cors());

// Apply the rate limiting middleware to API calls only, BEFORE body parser
app.use('/api', apiLimiter);

app.use(express.json());

const VALID_EMOJIS = ['🔥', '❤️', '👍', '👏', '🏆', '💯', '⚡'];

app.post('/api/admin/upload-json', upload.single('file'), async (req, res) => {
  try {
    const password = req.body.password;
    const adminPassword = process.env.ADMIN_PASSWORD || 'AddMax13$';
    
    if (password !== adminPassword) {
      return res.status(401).send('Невірний пароль');
    }

    if (!req.file) {
      return res.status(400).send('Файл не знайдено');
    }

    const data = JSON.parse(req.file.buffer.toString('utf8'));
    const messages = data.messages || [];
    
    const db = await getDb();
    const userMap = new Map();

    for (const msg of messages) {
      if (!msg.from_id || typeof msg.from_id !== 'string' || !msg.from_id.startsWith('user')) {
        continue;
      }
      
      const userId = parseInt(msg.from_id.replace('user', ''), 10);
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
        u.first_name = firstName;
      }
    }
    
    await db.exec('DELETE FROM users;');
    await db.exec('DELETE FROM messages;');
    
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

    res.status(200).send('Успішно оновлено');
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).send('Внутрішня помилка сервера під час обробки файлу');
  }
});

  app.get('/api/leaderboard', async (req, res) => {
  try {
    const db = await getDb();
    const topUsers = await db.all('SELECT id, username, first_name, karma FROM users ORDER BY karma DESC, id ASC LIMIT 50');
    res.json(topUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, first_name } = req.query;
    const db = await getDb();
    
    let user = await db.get('SELECT id, username, first_name, karma FROM users WHERE id = ?', id);
    
    // Auto-register if user not found and info is provided
    if (!user && first_name) {
      await db.run(
        'INSERT INTO users (id, username, first_name, karma) VALUES (?, ?, ?, 0)',
        [id, username || '', first_name]
      );
      user = { id: parseInt(id), username: username || '', first_name, karma: 0 };
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Rank logic: count users with more karma OR same karma but older account (smaller ID)
    const rankData = await db.get(
      'SELECT COUNT(*) as rank FROM users WHERE karma > ? OR (karma = ? AND id <= ?)',
      [user.karma, user.karma, user.id]
    );
    
    res.json({ ...user, rank: rankData.rank });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3015;

app.listen(PORT, async () => {
  console.log(`API Server running on port ${PORT}`);
  await getDb();
  
  if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'DUMMY_TOKEN') {
    bot.start({
      allowed_updates: ["message", "message_reaction", "callback_query"],
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started!`);
      }
    }).catch(err => console.error('Bot start error:', err));
  } else {
    console.log('BOT_TOKEN not provided, bot polling not started.');
  }
});
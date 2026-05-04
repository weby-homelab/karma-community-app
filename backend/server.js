require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { getDb } = require('./db');
const { getSettings, updateSettings } = require('./settings');
const { startBot } = require('./bot');

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

const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const VALID_EMOJIS = ['🔥', '❤️', '👍', '👏', '🏆', '💯', '⚡'];

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      site_title: settings.site_title || '🏆 Рейтинг активності',
      bot_name: settings.bot_name || ''
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const settings = await getSettings();
    const adminPassword = settings.admin_password || process.env.ADMIN_PASSWORD || 'AddMax13$';
    
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Невірний пароль' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  try {
    const { password, newSettings } = req.body;
    const settings = await getSettings();
    const adminPassword = settings.admin_password || process.env.ADMIN_PASSWORD || 'AddMax13$';
    
    if (password !== adminPassword) {
      return res.status(401).send('Невірний пароль');
    }

    await updateSettings(newSettings);
    res.json({ success: true });
    
    // Restart process to apply bot token changes if running under PM2/Systemd
    setTimeout(() => process.exit(0), 1000);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).send('Помилка сервера');
  }
});

app.post('/api/admin/settings/view', async (req, res) => {
  try {
    const { password } = req.body;
    const settings = await getSettings();
    const adminPassword = settings.admin_password || process.env.ADMIN_PASSWORD || 'AddMax13$';
    
    if (password !== adminPassword) {
      return res.status(401).send('Невірний пароль');
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).send('Помилка сервера');
  }
});

app.post('/api/admin/upload-json', upload.single('file'), async (req, res) => {
  try {
    const password = req.body.password;
    const settings = await getSettings();
    const adminPassword = settings.admin_password || process.env.ADMIN_PASSWORD || 'AddMax13$';
    
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
      const msgDate = parseInt(msg.date_unixtime || '9999999999', 10);
      let karmaToAdd = 0;
      
      if (msg.reactions && Array.isArray(msg.reactions)) {
        for (const reaction of msg.reactions) {
          if (reaction.type === 'emoji' && VALID_EMOJIS.includes(reaction.emoji)) {
            karmaToAdd += reaction.count || 1;
          }
        }
      }
      
      if (!userMap.has(userId)) {
        userMap.set(userId, { id: userId, first_name: firstName, username: '', karma: 0, join_date: msgDate });
      } else {
        const u = userMap.get(userId);
        if (msgDate < u.join_date) {
          u.join_date = msgDate;
        }
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
      `INSERT INTO users (id, username, first_name, karma, join_date) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET first_name=excluded.first_name, karma=users.karma + excluded.karma, join_date=MIN(users.join_date, excluded.join_date)`
    );
    
    for (const u of userMap.values()) {
      // Insert all users, even those with 0 karma
      await stmt.run([u.id, u.username, u.first_name, u.karma, u.join_date]);
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
    const topUsers = await db.all('SELECT id, username, first_name, karma FROM users ORDER BY karma DESC, join_date ASC, id ASC LIMIT 50');
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
    
    let user = await db.get('SELECT id, username, first_name, karma, join_date FROM users WHERE id = ?', id);
    
    // Auto-register if user not found and info is provided
    if (!user && first_name) {
      await db.run(
        'INSERT INTO users (id, username, first_name, karma, join_date) VALUES (?, ?, ?, 0, ?)',
        [id, username || '', first_name, Math.floor(Date.now() / 1000)]
      );
      user = { id: parseInt(id), username: username || '', first_name, karma: 0, join_date: Math.floor(Date.now() / 1000) };
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Rank logic: count users with more karma OR same karma but older account (smaller join_date) OR same karma and join_date but smaller ID
    const rankData = await db.get(
      'SELECT COUNT(*) as rank FROM users WHERE karma > ? OR (karma = ? AND join_date < ?) OR (karma = ? AND join_date = ? AND id <= ?)',
      [user.karma, user.karma, user.join_date, user.karma, user.join_date, user.id]
    );
    
    res.json({ ...user, rank: rankData.rank });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Catch-all route for SPA
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3015;

app.listen(PORT, async () => {
  console.log(`API Server running on port ${PORT}`);
  await getDb();
  
  const settings = await getSettings();
  const token = settings.bot_token || process.env.BOT_TOKEN;
  const webAppUrl = settings.webapp_url || 'https://kruhlyk.srvrs.top/';
  const chatId = settings.chat_id || '';
  
  if (token && token !== 'DUMMY_TOKEN') {
    startBot(token, webAppUrl, chatId);
  } else {
    console.log('BOT_TOKEN not provided in DB or .env, bot polling not started.');
  }
});
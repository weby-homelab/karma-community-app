require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');
const bot = require('./bot');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/leaderboard', async (req, res) => {
  try {
    const db = await getDb();
    const topUsers = await db.all('SELECT id, username, first_name, karma FROM users ORDER BY karma DESC LIMIT 50');
    res.json(topUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, username, first_name, karma FROM users WHERE id = ?', req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const rankData = await db.get('SELECT COUNT(*) as rank FROM users WHERE karma > ?', user.karma);
    res.json({ ...user, rank: rankData.rank + 1 });
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
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started!`);
      }
    });
  } else {
    console.log('BOT_TOKEN not provided, bot polling not started.');
  }
});
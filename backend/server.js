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
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started!`);
      }
    });
  } else {
    console.log('BOT_TOKEN not provided, bot polling not started.');
  }
});
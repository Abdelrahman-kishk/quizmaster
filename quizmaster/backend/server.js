require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const categoriesRoute = require('./routes/categories');
const gameRoute = require('./routes/game');
const leaderboardRoute = require('./routes/leaderboard');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

app.use('/api/categories', categoriesRoute);
app.use('/api/game', gameRoute);
app.use('/api', leaderboardRoute); // exposes /api/leaderboard and /api/player/:username/stats

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] QuizMaster API running on http://localhost:${PORT}`));
});

module.exports = app;

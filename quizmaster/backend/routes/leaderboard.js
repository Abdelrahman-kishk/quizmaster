const router = require('express').Router();
const { getLeaderboard, getPlayerStats } = require('../controllers/leaderboardController');

router.get('/leaderboard', getLeaderboard);
router.get('/player/:username/stats', getPlayerStats);

module.exports = router;

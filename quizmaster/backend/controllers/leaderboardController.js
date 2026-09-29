const Leaderboard = require('../models/Leaderboard');
const GameSession = require('../models/GameSession');
const Player = require('../models/Player');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/leaderboard?window=daily|weekly|all-time&category=&limit=50
async function getLeaderboard(req, res, next) {
  try {
    const { window = 'all-time', category, limit = 50 } = req.query;
    const cap = Math.min(parseInt(limit, 10) || 50, 100);

    if (window === 'all-time' && !category) {
      const rows = await Leaderboard.find({}).sort({ allTimeXP: -1 }).limit(cap);
      return res.json({
        success: true,
        data: rows.map((r, i) => ({ rank: i + 1, username: r.username, xp: r.allTimeXP, score: r.allTimeScore, gamesPlayed: r.gamesPlayed })),
      });
    }

    // Daily / weekly / category-filtered views are computed from raw sessions
    // since the aggregate Leaderboard collection only tracks all-time totals.
    const match = { status: 'finished' };
    if (category && category !== 'Random Category') match.category = category;
    if (window === 'daily') match.finishedAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    if (window === 'weekly') match.finishedAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };

    const rows = await GameSession.aggregate([
      { $match: match },
      { $group: { _id: '$playerName', xp: { $sum: '$xpEarned' }, score: { $sum: '$score' }, gamesPlayed: { $sum: 1 } } },
      { $sort: { xp: -1 } },
      { $limit: cap },
    ]);

    res.json({
      success: true,
      data: rows.map((r, i) => ({ rank: i + 1, username: r._id, xp: r.xp, score: r.score, gamesPlayed: r.gamesPlayed })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/player/:username/stats
async function getPlayerStats(req, res, next) {
  try {
    const { username } = req.params;
    const player = await Player.findOne({ username });
    if (!player) throw new ApiError(404, 'Player not found');

    const sessions = await GameSession.find({ playerName: username, status: 'finished' })
      .sort({ finishedAt: -1 }).limit(25);

    const wins = sessions.filter(s => s.accuracyPct >= 60).length;
    const winRate = sessions.length ? Math.round((wins / sessions.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        username: player.username,
        totalGamesPlayed: player.totalGamesPlayed,
        totalScore: player.totalScore,
        totalXP: player.totalXP,
        level: player.level,
        rankTier: player.rankTier,
        badges: player.badges,
        longestStreak: player.longestStreak,
        winRate,
        recentMatches: sessions.map(s => ({
          sessionId: s._id, category: s.category, difficulty: s.difficulty,
          score: s.score, accuracyPct: s.accuracyPct, xpEarned: s.xpEarned, finishedAt: s.finishedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeaderboard, getPlayerStats };

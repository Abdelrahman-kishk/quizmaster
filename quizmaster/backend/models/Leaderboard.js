const mongoose = require('mongoose');

// Aggregated, denormalized leaderboard entry per player.
// Kept up to date whenever a GameSession is finished (see gameController.finishGame).
const leaderboardSchema = new mongoose.Schema(
  {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true, unique: true },
    username: { type: String, required: true },
    allTimeXP: { type: Number, default: 0 },
    allTimeScore: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    byCategory: {
      type: Map,
      of: new mongoose.Schema({ bestScore: Number, gamesPlayed: Number }, { _id: false }),
      default: {},
    },
    byDifficulty: {
      type: Map,
      of: new mongoose.Schema({ bestScore: Number, gamesPlayed: Number }, { _id: false }),
      default: {},
    },
    lastPlayedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

leaderboardSchema.index({ allTimeXP: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);

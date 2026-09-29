const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 24 },
    email: { type: String, trim: true, lowercase: true, default: null },
    passwordHash: { type: String, default: null }, // null = guest/anonymous player
    totalGamesPlayed: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    rankTier: { type: String, default: 'Rookie Recruit' },
    badges: { type: [badgeSchema], default: [] },
    longestStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

playerSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

playerSchema.methods.checkPassword = function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('Player', playerSchema);

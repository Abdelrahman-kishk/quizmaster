const mongoose = require('mongoose');

const answerLogSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
    chosenAnswer: { type: String, default: null },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTakenSeconds: { type: Number, required: true },
    xpAwarded: { type: Number, required: true },
  },
  { _id: false }
);

const gameSessionSchema = new mongoose.Schema(
  {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    playerName: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    totalRounds: { type: Number, required: true },
    answers: { type: [answerLogSchema], default: [] },
    score: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    accuracyPct: { type: Number, default: 0 },
    avgTimePerQuestion: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'finished', 'abandoned'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSession', gameSessionSchema);

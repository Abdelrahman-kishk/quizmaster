const axios = require('axios');
const mongoose = require('mongoose');
const QuizQuestion = require('../models/QuizQuestion');
const GameSession = require('../models/GameSession');
const Player = require('../models/Player');
const Leaderboard = require('../models/Leaderboard');
const { ApiError } = require('../middleware/errorHandler');
const { calculateXP, rankTierForXP, QUESTION_TIME_LIMIT } = require('../utils/xp');
const { decodeQuestionPayload } = require('../utils/decodeHtml');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pull questions from the local DB; if not enough exist for the requested
// category/difficulty, top up from OpenTDB so the round count is always met.
async function sourceQuestions({ category, difficulty, amount }) {
  const filter = { difficulty };
  if (category && category !== 'Random Category') filter.category = category;

  let local = await QuizQuestion.aggregate([{ $match: filter }, { $sample: { size: amount } }]);

  if (local.length < amount) {
    const needed = amount - local.length;
    try {
      const params = { amount: needed, difficulty, type: 'multiple' };
      const { data } = await axios.get(process.env.OPENTDB_BASE_URL || 'https://opentdb.com/api.php', { params, timeout: 5000 });
      if (data.response_code === 0 && Array.isArray(data.results)) {
        const fetched = data.results.map(r => decodeQuestionPayload({
          category: category && category !== 'Random Category' ? category : (r.category || 'General Knowledge'),
          difficulty: r.difficulty,
          type: r.type,
          question: r.question,
          correctAnswer: r.correct_answer,
          incorrectAnswers: r.incorrect_answers,
        }));
        local = [...local, ...fetched];
      }
    } catch (err) {
      console.warn('[game] OpenTDB fetch failed, using offline fallback only:', err.message);
    }
  }

  // Final offline fallback if DB + OpenTDB still can't fill the round count.
  if (local.length < amount) {
    const fallback = require('../seed/questions').filter(q => q.difficulty === difficulty
      && (!category || category === 'Random Category' || q.category === category));
    local = [...local, ...shuffle(fallback)].slice(0, amount);
  }

  return shuffle(local).slice(0, amount);
}

// POST /api/game/start
async function startGame(req, res, next) {
  try {
    const { playerName, category = 'Random Category', difficulty = 'easy', rounds = 10 } = req.body;
    if (!playerName || !playerName.trim()) throw new ApiError(400, 'playerName is required');
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new ApiError(400, 'Invalid difficulty');
    const totalRounds = Math.min(Math.max(parseInt(rounds, 10) || 10, 1), 50);

    const questions = await sourceQuestions({ category, difficulty, amount: totalRounds });
    if (!questions.length) throw new ApiError(404, 'No questions available for this arena/difficulty');

    // Persist any freshly-fetched OpenTDB questions so future rounds can reuse them.
    const persisted = [];
    for (const q of questions) {
      if (q._id) { persisted.push(q); continue; }
      const doc = await QuizQuestion.create({
        category: q.category, difficulty: q.difficulty, type: q.type || 'multiple',
        question: q.question, correctAnswer: q.correctAnswer, incorrectAnswers: q.incorrectAnswers,
        source: 'opentdb',
      });
      persisted.push(doc.toObject());
    }

    const session = await GameSession.create({
      playerName: playerName.trim(),
      category, difficulty, totalRounds: persisted.length,
      status: 'in_progress',
    });

    // Server holds the ordered question id list in-session so /questions and
    // /submit-answer can't be tricked into serving a different set.
    session.set('questionOrder', persisted.map(q => (q._id || q.id).toString()));
    await session.save();

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        category, difficulty, totalRounds: persisted.length,
        timePerQuestion: QUESTION_TIME_LIMIT,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/game/questions?sessionId=...
// Returns sanitized questions (correct answer + explanation withheld) in session order.
async function getQuestions(req, res, next) {
  try {
    const { sessionId } = req.query;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) throw new ApiError(400, 'Valid sessionId is required');
    const session = await GameSession.findById(sessionId);
    if (!session) throw new ApiError(404, 'Game session not found');

    const order = session.get('questionOrder') || [];
    const questions = await QuizQuestion.find({ _id: { $in: order } });
    const byId = Object.fromEntries(questions.map(q => [q._id.toString(), q]));

    const sanitized = order.map(id => {
      const q = byId[id];
      if (!q) return null;
      const options = shuffle([q.correctAnswer, ...q.incorrectAnswers]);
      return { questionId: q._id, category: q.category, difficulty: q.difficulty, type: q.type, question: q.question, options };
    }).filter(Boolean);

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
}

// POST /api/game/submit-answer
// Verifies the answer against the DB (never trusts a client-sent "correct" flag)
// and computes XP server-side from actual elapsed time and running streak.
async function submitAnswer(req, res, next) {
  try {
    const { sessionId, questionId, answer, timeTakenSeconds } = req.body;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) throw new ApiError(400, 'Valid sessionId is required');
    if (!questionId || !mongoose.isValidObjectId(questionId)) throw new ApiError(400, 'Valid questionId is required');

    const session = await GameSession.findById(sessionId);
    if (!session) throw new ApiError(404, 'Game session not found');
    if (session.status !== 'in_progress') throw new ApiError(400, 'Session already finished');
    if (session.answers.some(a => a.questionId.toString() === questionId)) {
      throw new ApiError(400, 'Question already answered in this session');
    }

    const question = await QuizQuestion.findById(questionId);
    if (!question) throw new ApiError(404, 'Question not found');

    const clampedTime = Math.min(Math.max(parseFloat(timeTakenSeconds) || QUESTION_TIME_LIMIT, 0), QUESTION_TIME_LIMIT);
    const isCorrect = typeof answer === 'string' && answer.trim() === question.correctAnswer.trim();

    // Recompute the running streak from this session's own answer log (server-trusted).
    let streak = 0;
    for (let i = session.answers.length - 1; i >= 0; i--) {
      if (session.answers[i].isCorrect) streak++; else break;
    }
    const currentStreak = isCorrect ? streak + 1 : 0;

    const xpAwarded = calculateXP({ isCorrect, timeTakenSeconds: clampedTime, difficulty: question.difficulty, streak: currentStreak });

    session.answers.push({
      questionId: question._id, chosenAnswer: answer || null, correctAnswer: question.correctAnswer,
      isCorrect, timeTakenSeconds: clampedTime, xpAwarded,
    });
    session.score += xpAwarded;
    session.xpEarned += xpAwarded;
    await session.save();

    res.json({
      success: true,
      data: {
        isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation || null,
        xpAwarded, currentScore: session.score, currentStreak,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/game/finish
async function finishGame(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) throw new ApiError(400, 'Valid sessionId is required');

    const session = await GameSession.findById(sessionId);
    if (!session) throw new ApiError(404, 'Game session not found');
    if (session.status === 'finished') throw new ApiError(400, 'Session already finished');

    const totalAnswered = session.answers.length;
    const correctCount = session.answers.filter(a => a.isCorrect).length;
    const accuracyPct = totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const avgTime = totalAnswered
      ? Number((session.answers.reduce((s, a) => s + a.timeTakenSeconds, 0) / totalAnswered).toFixed(1))
      : 0;

    let longestStreak = 0, run = 0;
    for (const a of session.answers) { run = a.isCorrect ? run + 1 : 0; longestStreak = Math.max(longestStreak, run); }

    session.accuracyPct = accuracyPct;
    session.avgTimePerQuestion = avgTime;
    session.longestStreak = longestStreak;
    session.status = 'finished';
    session.finishedAt = new Date();
    await session.save();

    // Upsert player + leaderboard aggregate.
    let player = await Player.findOne({ username: session.playerName });
    if (!player) player = await Player.create({ username: session.playerName });

    player.totalGamesPlayed += 1;
    player.totalScore += session.score;
    player.totalXP += session.xpEarned;
    player.longestStreak = Math.max(player.longestStreak, longestStreak);
    player.rankTier = rankTierForXP(player.totalXP);
    if (accuracyPct === 100 && !player.badges.some(b => b.key === 'perfectionist')) {
      player.badges.push({ key: 'perfectionist', label: 'Perfectionist' });
    }
    if (longestStreak >= 10 && !player.badges.some(b => b.key === 'streak10')) {
      player.badges.push({ key: 'streak10', label: 'On Fire' });
    }
    await player.save();

    const board = await Leaderboard.findOneAndUpdate(
      { playerId: player._id },
      {
        $set: { username: player.username, lastPlayedAt: new Date() },
        $inc: { allTimeXP: session.xpEarned, allTimeScore: session.score, gamesPlayed: 1 },
      },
      { upsert: true, new: true }
    );
    board.byCategory.set(session.category, {
      bestScore: Math.max(session.score, board.byCategory.get(session.category)?.bestScore || 0),
      gamesPlayed: (board.byCategory.get(session.category)?.gamesPlayed || 0) + 1,
    });
    board.byDifficulty.set(session.difficulty, {
      bestScore: Math.max(session.score, board.byDifficulty.get(session.difficulty)?.bestScore || 0),
      gamesPlayed: (board.byDifficulty.get(session.difficulty)?.gamesPlayed || 0) + 1,
    });
    await board.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id, score: session.score, xpEarned: session.xpEarned,
        accuracyPct, avgTimePerQuestion: avgTime, longestStreak,
        rankTier: player.rankTier, totalXP: player.totalXP, level: player.level,
        review: session.answers.map(a => ({ questionId: a.questionId, chosenAnswer: a.chosenAnswer, correctAnswer: a.correctAnswer, isCorrect: a.isCorrect })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { startGame, getQuestions, submitAnswer, finishGame };

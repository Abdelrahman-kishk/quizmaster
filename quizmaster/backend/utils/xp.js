const DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2 };
const QUESTION_TIME_LIMIT = 15; // seconds, must match frontend timer

/**
 * Dynamic XP calculation.
 * base(100) + speedBonus(time remaining * 4) all multiplied by difficulty,
 * plus a streak multiplier (+10% per consecutive correct answer, capped at +50%).
 */
function calculateXP({ isCorrect, timeTakenSeconds, difficulty, streak }) {
  if (!isCorrect) return 0;
  const timeRemaining = Math.max(0, QUESTION_TIME_LIMIT - timeTakenSeconds);
  const base = 100;
  const speedBonus = Math.round(timeRemaining * 4);
  const diffMult = DIFFICULTY_MULTIPLIER[difficulty] || 1;
  const streakMult = 1 + Math.min(Math.max(streak - 1, 0), 5) * 0.1;
  return Math.round((base + speedBonus) * diffMult * streakMult);
}

function levelForXP(totalXP) {
  // simple level curve: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

const RANK_TIERS = [
  { minXP: 0, label: 'Rookie Recruit' },
  { minXP: 200, label: 'Knowledge Seeker' },
  { minXP: 600, label: 'Trivia Ace' },
  { minXP: 1200, label: 'Trivia Master' },
  { minXP: 2200, label: 'Grandmaster of Facts' },
];

function rankTierForXP(totalXP) {
  let tier = RANK_TIERS[0].label;
  for (const t of RANK_TIERS) if (totalXP >= t.minXP) tier = t.label;
  return tier;
}

module.exports = { calculateXP, levelForXP, rankTierForXP, DIFFICULTY_MULTIPLIER, QUESTION_TIME_LIMIT };

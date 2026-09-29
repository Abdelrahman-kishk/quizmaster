const QuizQuestion = require('../models/QuizQuestion');

// Static metadata (icon + display info) for each arena the frontend renders as a card.
const CATEGORY_META = {
  'Random Category': { icon: 'dice', description: 'A random mix from every arena' },
  'General Knowledge': { icon: 'brain', description: 'A bit of everything' },
  'Computers': { icon: 'cpu', description: 'Tech, software & hardware' },
  'Science & Nature': { icon: 'flask', description: 'Biology, chemistry, physics & more' },
  'History': { icon: 'landmark', description: 'People, wars & civilizations' },
  'Sports': { icon: 'medal', description: 'Athletes, teams & records' },
  'Geography': { icon: 'globe', description: 'Countries, capitals & landmarks' },
  'Film': { icon: 'clapperboard', description: 'Movies, directors & actors' },
  'Music': { icon: 'music', description: 'Artists, songs & genres' },
  'Mathematics': { icon: 'calculator', description: 'Numbers, logic & puzzles' },
  'Animals': { icon: 'paw-print', description: 'Wildlife & the animal kingdom' },
  'Video Games': { icon: 'gamepad-2', description: 'Games, studios & consoles' },
  'Television': { icon: 'tv', description: 'Shows, series & streaming' },
};

async function getCategories(req, res, next) {
  try {
    const counts = await QuizQuestion.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));

    const categories = Object.entries(CATEGORY_META).map(([name, meta]) => ({
      name,
      icon: meta.icon,
      description: meta.description,
      questionCount: name === 'Random Category' ? counts.reduce((s, c) => s + c.count, 0) : (countMap[name] || 0),
    }));

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, CATEGORY_META };

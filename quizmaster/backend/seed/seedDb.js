require('dotenv').config();
const connectDB = require('../config/db');
const QuizQuestion = require('../models/QuizQuestion');
const questions = require('./questions');

(async () => {
  await connectDB();
  const existing = await QuizQuestion.countDocuments({ source: 'custom' });
  if (existing > 0) {
    console.log(`[seed] ${existing} custom questions already present — skipping (drop the collection to reseed).`);
    process.exit(0);
  }
  const docs = await QuizQuestion.insertMany(questions.map(q => ({ ...q, source: 'custom' })));
  console.log(`[seed] Inserted ${docs.length} questions.`);
  process.exit(0);
})().catch(err => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

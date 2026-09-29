const mongoose = require('mongoose');

const CATEGORIES = [
  'General Knowledge', 'Computers', 'Science & Nature', 'History', 'Sports',
  'Geography', 'Film', 'Music', 'Mathematics', 'Animals', 'Video Games', 'Television',
];

const quizQuestionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, enum: CATEGORIES },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    type: { type: String, required: true, enum: ['multiple', 'boolean'], default: 'multiple' },
    question: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    incorrectAnswers: { type: [String], required: true, validate: v => v.length >= 1 },
    explanation: { type: String, default: '' },
    source: { type: String, enum: ['custom', 'opentdb'], default: 'custom' },
  },
  { timestamps: true }
);

quizQuestionSchema.index({ category: 1, difficulty: 1 });

quizQuestionSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);

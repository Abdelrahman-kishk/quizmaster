const he = require('he');

// OpenTDB returns HTML-entity-encoded text (e.g. "&quot;", "&amp;").
function decodeHtml(str) {
  if (typeof str !== 'string') return str;
  return he.decode(str);
}

function decodeQuestionPayload(q) {
  return {
    ...q,
    question: decodeHtml(q.question),
    correctAnswer: decodeHtml(q.correctAnswer || q.correct_answer),
    incorrectAnswers: (q.incorrectAnswers || q.incorrect_answers || []).map(decodeHtml),
  };
}

module.exports = { decodeHtml, decodeQuestionPayload };

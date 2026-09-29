const router = require('express').Router();
const { startGame, getQuestions, submitAnswer, finishGame } = require('../controllers/gameController');

router.post('/start', startGame);
router.get('/questions', getQuestions);
router.post('/submit-answer', submitAnswer);
router.post('/finish', finishGame);

module.exports = router;

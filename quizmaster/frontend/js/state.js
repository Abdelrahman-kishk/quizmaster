// Central client state for the SPA. app.js reads/mutates this and re-renders.
const State = {
  screen: 'lobby', // lobby | quiz | results | leaderboard
  name: localStorage.getItem('qm_name') || '',
  category: 'Random Category',
  difficulty: 'easy',
  rounds: 10,

  sessionId: null,
  timePerQuestion: 15,
  questions: [],
  idx: 0,
  timer: null,
  timeLeft: 15,

  score: 0,
  streak: 0,
  bestStreak: 0,
  results: null,

  reset() {
    this.sessionId = null; this.questions = []; this.idx = 0; this.score = 0;
    this.streak = 0; this.bestStreak = 0; this.results = null;
    clearInterval(this.timer);
  },
};

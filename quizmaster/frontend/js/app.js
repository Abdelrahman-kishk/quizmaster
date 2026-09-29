const CAT_ICONS = {
  'Random Category': '🎲', 'General Knowledge': '🧠', Computers: '💻', 'Science & Nature': '🔬',
  History: '🏛️', Sports: '🏅', Geography: '🌍', Film: '🎬', Music: '🎵', Mathematics: '➗',
  Animals: '🐾', 'Video Games': '🎮', Television: '📺',
};
let CATEGORIES = [];

const app = document.getElementById('app');

function render() {
  if (State.screen === 'lobby') app.innerHTML = lobbyView();
  else if (State.screen === 'quiz') app.innerHTML = quizView();
  else if (State.screen === 'results') app.innerHTML = resultsView();
  else if (State.screen === 'leaderboard') app.innerHTML = leaderboardView();
  bind();
}

function lobbyView() {
  const cats = CATEGORIES.length ? CATEGORIES : Object.keys(CAT_ICONS).map(name => ({ name }));
  return `
  <div class="text-center mb-6">
    <div class="text-4xl">🏆</div>
    <h1 class="text-3xl font-extrabold mt-1" style="background:var(--grad); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent">QuizMaster</h1>
    <div class="text-sm" style="color:var(--muted)">The Ultimate Trivia Challenge — Test Your Knowledge</div>
  </div>
  <div class="glass p-6 flex flex-col gap-5">
    <div>
      <label class="text-sm font-semibold" style="color:var(--muted)">Player name</label>
      <input type="text" id="nameInput" placeholder="Enter your name" value="${State.name.replace(/"/g, '')}" class="mt-1">
    </div>
    <div>
      <label class="text-sm font-semibold" style="color:var(--muted)">Select arena</label>
      <div class="grid grid-cols-3 gap-2 mt-2">
        ${cats.map(c => `<div class="cat ${c.name === State.category ? 'active' : ''}" data-cat="${c.name}">
          <span class="block text-xl mb-1">${CAT_ICONS[c.name] || '❓'}</span>${c.name}
        </div>`).join('')}
      </div>
    </div>
    <div>
      <label class="text-sm font-semibold" style="color:var(--muted)">Difficulty</label>
      <div class="flex gap-2 mt-2">
        ${['easy', 'medium', 'hard'].map(d => `<div class="pill diff flex-1 text-center ${State.difficulty === d ? 'active' : ''}"
          data-diff="${d}" style="${State.difficulty === d ? `background:${d === 'easy' ? 'var(--emerald)' : d === 'medium' ? 'var(--amber)' : 'var(--rose)'}; color:#04070f` : ''}">
          ${d[0].toUpperCase() + d.slice(1)} Mode</div>`).join('')}
      </div>
    </div>
    <div>
      <label class="text-sm font-semibold" style="color:var(--muted)">Number of rounds</label>
      <div class="flex gap-2 mt-2">
        ${[5, 10, 15, 20].map(r => `<div class="pill rd ${State.rounds === r ? 'active' : ''}" data-rd="${r}"
          style="${State.rounds === r ? 'background:var(--indigo); color:#04070f' : ''}">${r}</div>`).join('')}
      </div>
      <div class="text-xs mt-1" style="color:var(--muted)">More rounds = more XP potential!</div>
    </div>
    <button class="btn btn-primary w-full" id="startBtn">Start Game →</button>
    <button class="btn btn-ghost w-full" id="lbBtn">View Global Leaderboard</button>
    <button class="btn btn-ghost w-full text-xs" id="soundBtn">Sound: ${Sound.isEnabled() ? 'On 🔊' : 'Off 🔇'}</button>
  </div>
  <div id="lobbyError" class="text-sm mt-3 text-center" style="color:var(--rose)"></div>`;
}

function quizView() {
  const q = State.questions[State.idx];
  const pct = Math.round((State.timeLeft / State.timePerQuestion) * 100);
  const barColor = State.timeLeft <= 5 ? 'var(--rose)' : State.timeLeft <= 8 ? 'var(--amber)' : 'var(--emerald)';
  return `
  <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
    <span class="badge">${q.category} · ${q.difficulty}</span>
    <span class="badge">Question ${State.idx + 1} of ${State.questions.length}</span>
  </div>
  <div class="flex justify-between items-center mb-4">
    <div class="num text-xl font-bold">${State.score} pts</div>
    <div class="badge" style="background:rgba(251,191,36,.15); color:var(--amber)">🔥 Streak ×${State.streak}</div>
  </div>
  <div class="timerbar-outer mb-6"><div class="timerbar-inner" id="tbar" style="width:${pct}%; background:${barColor}"></div></div>
  <div class="glass p-6 mb-5"><div class="text-lg font-semibold leading-snug">${q.question}</div></div>
  <div class="flex flex-col gap-2" id="opts">
    ${q.options.map((o, i) => `<button class="opt btn" data-answer="${encodeURIComponent(o)}">
      <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style="background:rgba(255,255,255,.08)">${['A', 'B', 'C', 'D'][i]}</span>${o}
    </button>`).join('')}
  </div>`;
}

function resultsView() {
  const r = State.results;
  return `
  <div class="text-center mb-6">
    <div class="text-5xl">🎉</div>
    <h2 class="text-2xl font-bold mt-2">Game Over, ${State.name}!</h2>
    <div class="badge mt-2" style="background:rgba(99,102,241,.18); color:#c7c9f7; padding:7px 14px">${r.rankTier}</div>
  </div>
  <div class="glass p-6 mb-4">
    <div class="statgrid">
      <div class="statbox"><div class="text-xs" style="color:var(--muted)">Final Score</div><div class="num text-xl font-bold">${r.score}</div></div>
      <div class="statbox"><div class="text-xs" style="color:var(--muted)">XP Earned</div><div class="num text-xl font-bold" style="color:var(--emerald)">+${r.xpEarned}</div></div>
      <div class="statbox"><div class="text-xs" style="color:var(--muted)">Accuracy</div><div class="num text-xl font-bold">${r.accuracyPct}%</div></div>
      <div class="statbox"><div class="text-xs" style="color:var(--muted)">Avg Time / Q</div><div class="num text-xl font-bold">${r.avgTimePerQuestion}s</div></div>
    </div>
    <div class="statbox mt-3"><div class="text-xs" style="color:var(--muted)">Longest Streak</div><div class="num text-xl font-bold">🔥 ×${r.longestStreak}</div></div>
  </div>
  <details class="glass p-4 mb-4">
    <summary class="cursor-pointer font-semibold">Question review</summary>
    <div class="mt-3 flex flex-col gap-2">
      ${r.review.map((rv, i) => `<div class="pt-2" style="border-top:1px solid var(--card-b)">
        <div class="text-sm">Your answer: <span style="color:${rv.isCorrect ? 'var(--emerald)' : 'var(--rose)'}">${rv.chosenAnswer || '(no answer)'}</span></div>
        ${!rv.isCorrect ? `<div class="text-sm" style="color:var(--emerald)">Correct: ${rv.correctAnswer}</div>` : ''}
      </div>`).join('')}
    </div>
  </details>
  <div class="flex flex-col gap-2">
    <button class="btn btn-primary" id="againBtn">Play Again</button>
    <button class="btn btn-ghost" id="changeBtn">Change Arena</button>
    <button class="btn btn-ghost" id="lbBtn2">View Global Leaderboard</button>
  </div>`;
}

function leaderboardView() {
  const rows = leaderboardCache || [];
  const top3 = rows.slice(0, 3), rest = rows.slice(3, 20);
  const medal = ['🥇', '🥈', '🥉'];
  return `
  <h2 class="text-center mb-4 text-2xl font-bold">🏆 Global Leaderboard</h2>
  <div class="flex gap-2 justify-center mb-4">
    ${['all-time', 'weekly', 'daily'].map(w => `<div class="pill lbwin ${lbWindow === w ? 'active' : ''}" data-win="${w}"
      style="${lbWindow === w ? 'background:var(--indigo); color:#04070f' : ''}">${w}</div>`).join('')}
  </div>
  ${top3.length ? `<div class="flex gap-2 justify-center mb-4">
    ${top3.map((p, i) => `<div class="glass p-3 flex-1 text-center">
      <div class="text-xl">${medal[i]}</div>
      <div class="font-bold text-sm mt-1">${p.username}</div>
      <div class="num text-sm" style="color:var(--emerald)">${p.xp} XP</div>
    </div>`).join('')}
  </div>` : `<div class="glass p-5 text-center" style="color:var(--muted)">No games played yet — be the first!</div>`}
  ${rest.length ? `<div class="glass p-1">
    ${rest.map((p, i) => `<div class="flex justify-between px-4 py-3" style="${i < rest.length - 1 ? 'border-bottom:1px solid var(--card-b)' : ''}">
      <span>#${p.rank} ${p.username}</span><span class="num" style="color:var(--emerald)">${p.xp} XP</span>
    </div>`).join('')}
  </div>` : ''}
  <button class="btn btn-ghost w-full mt-4" id="backBtn">Back</button>`;
}

let leaderboardCache = [];
let lbWindow = 'all-time';

function bind() {
  app.querySelectorAll('.cat').forEach(el => el.onclick = () => { State.category = el.dataset.cat; render(); });
  app.querySelectorAll('.diff').forEach(el => el.onclick = () => { State.difficulty = el.dataset.diff; render(); });
  app.querySelectorAll('.rd').forEach(el => el.onclick = () => { State.rounds = +el.dataset.rd; render(); });
  const startBtn = app.querySelector('#startBtn'); if (startBtn) startBtn.onclick = startGame;
  const soundBtn = app.querySelector('#soundBtn'); if (soundBtn) soundBtn.onclick = () => { Sound.toggle(); render(); };
  const lb = app.querySelector('#lbBtn'); if (lb) lb.onclick = openLeaderboard;
  const lb2 = app.querySelector('#lbBtn2'); if (lb2) lb2.onclick = openLeaderboard;
  const back = app.querySelector('#backBtn'); if (back) back.onclick = () => { State.screen = 'lobby'; render(); };
  const again = app.querySelector('#againBtn'); if (again) again.onclick = startGame;
  const change = app.querySelector('#changeBtn'); if (change) change.onclick = () => { State.screen = 'lobby'; render(); };
  app.querySelectorAll('.lbwin').forEach(el => el.onclick = () => { lbWindow = el.dataset.win; loadLeaderboard(); });
  app.querySelectorAll('.opt').forEach(el => el.onclick = () => selectAnswer(decodeURIComponent(el.dataset.answer)));
}

async function openLeaderboard() {
  State.screen = 'leaderboard'; render(); await loadLeaderboard();
}
async function loadLeaderboard() {
  try {
    leaderboardCache = await Api.getLeaderboard(`?window=${lbWindow}`);
  } catch (e) { leaderboardCache = []; }
  render();
}

async function startGame() {
  const errBox = document.getElementById('lobbyError');
  const nameInput = document.getElementById('nameInput');
  const name = (nameInput && nameInput.value.trim()) || State.name;
  if (!name) { if (errBox) errBox.textContent = 'Please enter a player name.'; return; }
  State.name = name; localStorage.setItem('qm_name', name);
  State.reset();

  try {
    const startData = await Api.startGame({ playerName: name, category: State.category, difficulty: State.difficulty, rounds: State.rounds });
    State.sessionId = startData.sessionId;
    State.timePerQuestion = startData.timePerQuestion;
    State.questions = await Api.getQuestions(State.sessionId);
    if (!State.questions.length) throw new Error('No questions returned for this arena.');
    State.screen = 'quiz'; render(); startTimer();
  } catch (e) {
    if (errBox) errBox.textContent = e.message || 'Could not start game. Is the API server running?';
    render();
  }
}

function startTimer() {
  clearInterval(State.timer);
  State.timeLeft = State.timePerQuestion;
  State.timer = setInterval(() => {
    State.timeLeft--;
    const bar = document.getElementById('tbar');
    if (bar) {
      bar.style.width = Math.round((State.timeLeft / State.timePerQuestion) * 100) + '%';
      bar.style.background = State.timeLeft <= 5 ? 'var(--rose)' : State.timeLeft <= 8 ? 'var(--amber)' : 'var(--emerald)';
    }
    if (State.timeLeft <= 0) { clearInterval(State.timer); selectAnswer(null); }
  }, 1000);
}

async function selectAnswer(answer) {
  clearInterval(State.timer);
  const q = State.questions[State.idx];
  const timeTaken = State.timePerQuestion - Math.max(State.timeLeft, 0);

  let result;
  try {
    result = await Api.submitAnswer({ sessionId: State.sessionId, questionId: q.questionId, answer, timeTakenSeconds: timeTaken });
  } catch (e) {
    result = { isCorrect: false, correctAnswer: '(unknown — request failed)', xpAwarded: 0, currentScore: State.score, currentStreak: 0 };
  }

  document.querySelectorAll('.opt').forEach(el => {
    el.disabled = true;
    const val = decodeURIComponent(el.dataset.answer);
    if (val === result.correctAnswer) el.classList.add('correct');
    else if (val === answer) el.classList.add('wrong');
  });

  Sound.play(result.isCorrect ? 'correct' : 'incorrect');
  State.score = result.currentScore;
  State.streak = result.currentStreak;
  State.bestStreak = Math.max(State.bestStreak, State.streak);

  setTimeout(() => {
    State.idx++;
    if (State.idx < State.questions.length) { render(); startTimer(); }
    else finishGame();
  }, 1400);
}

async function finishGame() {
  try {
    State.results = await Api.finishGame(State.sessionId);
  } catch (e) {
    State.results = { score: State.score, xpEarned: State.score, accuracyPct: 0, avgTimePerQuestion: 0, longestStreak: State.bestStreak, rankTier: 'Rookie Recruit', review: [] };
  }
  Sound.play('victory');
  if (window.confetti) confetti({ particleCount: 140, spread: 90, origin: { y: 0.3 }, colors: ['#6366F1', '#9333EA', '#10B981', '#FBBF24'] });
  State.screen = 'results'; render();
}

(async function init() {
  try { CATEGORIES = await Api.getCategories(); } catch (e) { CATEGORIES = []; }
  render();
})();

// Thin wrapper around the QuizMaster backend. Change API_BASE if the API
// isn't running on localhost:5000 (e.g. deployed backend URL).
const API_BASE = window.QUIZMASTER_API_BASE || 'http://localhost:5000/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  }
  return body.data;
}

const Api = {
  getCategories: () => apiFetch('/categories'),
  startGame: (payload) => apiFetch('/game/start', { method: 'POST', body: JSON.stringify(payload) }),
  getQuestions: (sessionId) => apiFetch(`/game/questions?sessionId=${sessionId}`),
  submitAnswer: (payload) => apiFetch('/game/submit-answer', { method: 'POST', body: JSON.stringify(payload) }),
  finishGame: (sessionId) => apiFetch('/game/finish', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  getLeaderboard: (params = '') => apiFetch(`/leaderboard${params}`),
  getPlayerStats: (username) => apiFetch(`/player/${encodeURIComponent(username)}/stats`),
};

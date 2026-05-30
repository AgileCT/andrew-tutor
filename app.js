// ── Constants ──────────────────────────────────────────────────────────────
const LS_PROGRESS = "andrew_progress";
const LS_HISTORY  = "andrew_history";
const LS_SETTINGS = "andrew_settings";

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  currentLessonId: "1.1",
  mode: "lesson",
  messages: [],
  isStreaming: false,
};

// ── localStorage ────────────────────────────────────────────────────────────
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS)) || {}; }
  catch { return {}; }
}

function saveProgress(p) {
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}; }
  catch { return {}; }
}

function saveSettings(s) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; }
  catch { return []; }
}

function saveHistory(msgs) {
  localStorage.setItem(LS_HISTORY, JSON.stringify(msgs));
}

function getLessonStatus(id) {
  const p = loadProgress();
  if (p[id]) return p[id];
  return id === "1.1" ? "in_progress" : "locked";
}

function completeLesson(id) {
  const p = loadProgress();
  p[id] = "completed";
  const nextId = getNextLessonId(id);
  if (nextId && !p[nextId]) p[nextId] = "in_progress";
  saveProgress(p);
}

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  const settings = loadSettings();
  state.currentLessonId = settings.currentLesson || "1.1";
  state.mode = settings.mode || "lesson";
  state.messages = loadHistory();

  renderSidebar();
  renderModeToggle();
  updateLessonHeader();
  renderMessages();

  if (state.messages.length === 0 && state.mode === "lesson") {
    startLesson();
  }

  setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

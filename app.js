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

// ── Sidebar ────────────────────────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById("curriculumNav");
  const all = getAllLessons();
  const completedCount = all.filter(
    (l) => getLessonStatus(l.id) === "completed"
  ).length;

  document.getElementById("progressSummary").textContent =
    `进度: ${completedCount} / ${all.length} 课`;

  nav.innerHTML = Object.values(curriculum)
    .map(
      (mod) =>
        `<div class="module-title">${mod.title}</div>` +
        mod.lessons
          .map((lesson) => {
            const status = getLessonStatus(lesson.id);
            const isActive = lesson.id === state.currentLessonId;
            return `<div class="lesson-item ${status}${isActive ? " active" : ""}" data-id="${lesson.id}">
              <span class="lesson-dot"></span>${lesson.title}
            </div>`;
          })
          .join("")
    )
    .join("");

  nav.querySelectorAll(".lesson-item:not(.locked)").forEach((el) => {
    el.addEventListener("click", () => switchLesson(el.dataset.id));
  });
}

function switchLesson(id) {
  if (state.isStreaming) return;
  state.currentLessonId = id;
  state.messages = [];
  saveHistory([]);
  saveSettings({ ...loadSettings(), currentLesson: id });
  renderSidebar();
  updateLessonHeader();
  renderMessages();
  if (state.mode === "lesson") startLesson();
}

function renderModeToggle() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.mode);
  });
}

function updateLessonHeader() {
  const lesson = getLessonById(state.currentLessonId);
  document.getElementById("currentLessonTitle").textContent =
    lesson ? lesson.title : "";
}

// ── Event Listeners ────────────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById("sendBtn").addEventListener("click", handleSend);

  document.getElementById("userInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.isStreaming) return;
      state.mode = btn.dataset.mode;
      saveSettings({ ...loadSettings(), mode: state.mode });
      renderModeToggle();
    });
  });
}

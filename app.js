// ── Constants ──────────────────────────────────────────────────────────────
const LS_PROGRESS = "andrew_progress";
const LS_HISTORY  = "andrew_history";
const LS_SETTINGS = "andrew_settings";

// ── i18n ───────────────────────────────────────────────────────────────────
const i18n = {
  zh: {
    appTitle: "AI 私教",
    progress: (d, total) => `进度: ${d} / ${total} 课`,
    lessonMode: "课程模式",
    freeChat: "自由提问",
    placeholder: "输入问题，Enter 发送，Shift+Enter 换行...",
    send: "发送",
    startMsg: "开始这节课吧！",
    completeBtn: "✓ 完成这节课，解锁下一课",
    unlockHint: (title) => `Great work! 🎉 下一课「${title}」已解锁 — 点击左侧继续。`,
    error: (msg) => `错误: ${msg}`,
    connError: (msg) => `连接错误: ${msg}`,
  },
  en: {
    appTitle: "AI Tutor",
    progress: (d, total) => `Progress: ${d} / ${total}`,
    lessonMode: "Lesson Mode",
    freeChat: "Free Q&A",
    placeholder: "Ask a question, Enter to send, Shift+Enter for new line...",
    send: "Send",
    startMsg: "Let's start this lesson!",
    completeBtn: "✓ Complete lesson, unlock next",
    unlockHint: (title) => `Great work! 🎉 Next: "${title}" unlocked — click the sidebar to continue.`,
    error: (msg) => `Error: ${msg}`,
    connError: (msg) => `Connection error: ${msg}`,
  },
};

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  currentLessonId: "1.1",
  mode: "lesson",
  lang: "zh",
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
  state.lang = settings.lang || "zh";
  state.messages = loadHistory().filter((m) => {
    if (m.isError) return false;
    if (m.role === "assistant") {
      const c = m.content || "";
      // Drop legacy error messages saved before isError flag existed
      if (c.startsWith("错误:") || c.startsWith("Error:") ||
          c.startsWith("连接错误:") || c.startsWith("Connection error:")) return false;
    }
    return true;
  });

  applyLangToStaticUI();
  renderSidebar();
  renderModeToggle();
  renderLangToggle();
  updateLessonHeader();
  renderMessages();

  if (state.messages.length === 0 && state.mode === "lesson") {
    startLesson();
  }

  setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

// ── Lang ───────────────────────────────────────────────────────────────────
function t() {
  return i18n[state.lang];
}

function applyLangToStaticUI() {
  document.getElementById("appTitle").textContent = t().appTitle;
  document.getElementById("userInput").placeholder = t().placeholder;
  document.getElementById("sendBtn").textContent = t().send;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.textContent = btn.dataset.mode === "lesson" ? t().lessonMode : t().freeChat;
  });
}

function renderLangToggle() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });
}

function switchLang(lang) {
  if (state.isStreaming) return;
  state.lang = lang;
  saveSettings({ ...loadSettings(), lang });
  applyLangToStaticUI();
  renderLangToggle();
  renderSidebar();
  updateLessonHeader();
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById("curriculumNav");
  const all = getAllLessons();
  const completedCount = all.filter(
    (l) => getLessonStatus(l.id) === "completed"
  ).length;

  document.getElementById("progressSummary").textContent =
    t().progress(completedCount, all.length);

  nav.innerHTML = Object.values(curriculum)
    .map(
      (mod) =>
        `<div class="module-title">${moduleTitle(mod, state.lang)}</div>` +
        mod.lessons
          .map((lesson) => {
            const status = getLessonStatus(lesson.id);
            const isActive = lesson.id === state.currentLessonId;
            return `<div class="lesson-item ${status}${isActive ? " active" : ""}" data-id="${lesson.id}">
              <span class="lesson-dot"></span>${lessonTitle(lesson, state.lang)}
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
    lesson ? lessonTitle(lesson, state.lang) : "";
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

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchLang(btn.dataset.lang));
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (state.isStreaming) return;
    state.messages = [];
    saveHistory([]);
    renderMessages();
    if (state.mode === "lesson") startLesson();
  });
}

// ── Message Rendering ──────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatText(text) {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function renderMessages() {
  const container = document.getElementById("messages");
  container.innerHTML = state.messages
    .map((msg) => {
      if (msg.role === "user") {
        return `<div class="msg user"><div class="msg-bubble">${escapeHtml(msg.content)}</div></div>`;
      }
      return `<div class="msg assistant">
        ${msg.thinkingSeconds ? `<div class="thinking-badge">Thought for ${msg.thinkingSeconds}s ›</div>` : ""}
        <div class="msg-bubble">${formatText(msg.content)}</div>
      </div>`;
    })
    .join("");
  container.scrollTop = container.scrollHeight;
}

function scrollToBottom() {
  const c = document.getElementById("messages");
  c.scrollTop = c.scrollHeight;
}

// ── SSE Streaming ──────────────────────────────────────────────────────────
async function sendMessage(userContent) {
  if (state.isStreaming) return;

  const lesson = getLessonById(state.currentLessonId);
  state.messages.push({ role: "user", content: userContent });

  const apiMessages = state.messages.map(({ role, content }) => ({
    role,
    content,
  }));

  state.isStreaming = true;
  document.getElementById("sendBtn").disabled = true;

  const assistantMsg = { role: "assistant", content: "", thinkingSeconds: null, isError: false };
  state.messages.push(assistantMsg);
  renderMessages();

  const container = document.getElementById("messages");
  const lastMsg = container.lastElementChild;
  const bubble = lastMsg.querySelector(".msg-bubble");
  bubble.classList.add("typing-cursor");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        currentLesson: lesson ? lessonTitle(lesson, state.lang) : state.currentLessonId,
        mode: state.mode,
        lang: state.lang,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === "thinking_end") {
            assistantMsg.thinkingSeconds = event.seconds;
            const badge = document.createElement("div");
            badge.className = "thinking-badge";
            badge.textContent = `Thought for ${event.seconds}s ›`;
            lastMsg.insertBefore(badge, bubble);
          }

          if (event.type === "text") {
            assistantMsg.content += event.text;
            bubble.innerHTML = formatText(assistantMsg.content);
            scrollToBottom();
          }

          if (event.type === "error") {
            assistantMsg.content = t().error(event.message);
            assistantMsg.isError = true;
            bubble.textContent = assistantMsg.content;
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  } catch (err) {
    assistantMsg.content = t().connError(err.message);
    assistantMsg.isError = true;
    bubble.textContent = assistantMsg.content;
  }

  bubble.classList.remove("typing-cursor");
  state.isStreaming = false;
  document.getElementById("sendBtn").disabled = false;

  // Don't persist error messages — roll back the failed exchange
  if (assistantMsg.isError) {
    state.messages = state.messages.slice(0, -2);
  }
  saveHistory(state.messages);

  if (
    state.mode === "lesson" &&
    getLessonStatus(state.currentLessonId) === "in_progress"
  ) {
    showCompleteLessonButton();
  }

  scrollToBottom();
}

function handleSend() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text || state.isStreaming) return;
  input.value = "";
  sendMessage(text);
}

function startLesson() {
  sendMessage(t().startMsg);
}

// ── Lesson Completion ──────────────────────────────────────────────────────
function showCompleteLessonButton() {
  document.querySelector(".complete-btn")?.remove();

  const btn = document.createElement("button");
  btn.className = "complete-btn";
  btn.textContent = t().completeBtn;

  btn.addEventListener("click", () => {
    completeLesson(state.currentLessonId);
    btn.remove();
    renderSidebar();

    const nextId = getNextLessonId(state.currentLessonId);
    if (nextId) {
      const nextLesson = getLessonById(nextId);
      const hint = {
        role: "assistant",
        content: t().unlockHint(lessonTitle(nextLesson, state.lang)),
        thinkingSeconds: null,
      };
      state.messages.push(hint);
      saveHistory(state.messages);
      renderMessages();
    }
  });

  document.getElementById("messages").appendChild(btn);
  scrollToBottom();
}

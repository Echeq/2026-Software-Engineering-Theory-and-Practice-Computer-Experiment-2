/* Team Chat — HTTP polling, no WebSocket dependency */

const CHAT_API = "/api/chat";
const POLL_ACTIVE  = 2500;   // ms when chat is visible
const POLL_IDLE    = 10000;  // ms when chat is in background

let pollTimer     = null;
let lastMessageId = null;
let unreadCount   = 0;
let myUserId      = null;
let initialLoad   = true;

const PALETTE = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316"];
function avatarColor(id) {
  let h = 5381;
  if (!id) return PALETTE[0];
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

document.addEventListener("DOMContentLoaded", () => {
  waitForUser();
});

function waitForUser(attempts = 0) {
  if (typeof currentUser !== "undefined" && currentUser) {
    myUserId = currentUser.id;
    startPolling(POLL_IDLE);
  } else if (attempts < 40) {
    setTimeout(() => waitForUser(attempts + 1), 300);
  }
}

// ── Polling ───────────────────────────────────────────────────

function startPolling(interval) {
  stopPolling();
  fetchMessages();                              // immediate fetch
  pollTimer = setInterval(fetchMessages, interval);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

async function fetchMessages() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${CHAT_API}/messages`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data  = await res.json();
    const msgs  = data.messages || [];
    renderNewMessages(msgs);
    setOnlineText("Connected");
  } catch {
    setOnlineText("Reconnecting…");
    if (initialLoad) {
      setChatMessages('<div class="chat-empty">Could not reach chat server. Retrying…</div>');
    }
  }
}

function renderNewMessages(messages) {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  if (!messages.length) {
    if (initialLoad) {
      setChatMessages('<div class="chat-empty">No messages yet. Say hello!</div>');
      initialLoad = false;
    }
    return;
  }

  // First successful load — render everything
  if (initialLoad) {
    container.innerHTML = "";
    messages.forEach(m => appendMessage(m, false));
    container.scrollTop = container.scrollHeight;
    lastMessageId = messages[messages.length - 1].id;
    initialLoad   = false;
    return;
  }

  // Subsequent polls — only append messages newer than lastMessageId
  const idx = messages.findIndex(m => m.id === lastMessageId);
  const fresh = idx === -1 ? messages : messages.slice(idx + 1);
  if (!fresh.length) return;

  // Remove "no messages" placeholder if present
  container.querySelector(".chat-empty")?.remove();

  const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  fresh.forEach(m => appendMessage(m, true));
  lastMessageId = messages[messages.length - 1].id;

  if (wasAtBottom) container.scrollTop = container.scrollHeight;

  // Badge for unread when chat is not visible
  const chatSection = document.getElementById("chat");
  const isVisible   = chatSection && chatSection.style.display !== "none";
  if (!isVisible) {
    unreadCount += fresh.length;
    updateBadge();
  }
}

// ── Send ──────────────────────────────────────────────────────

async function sendMessage() {
  const input = document.getElementById("chat-input");
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;

  input.value = "";
  input.disabled = true;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${CHAT_API}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ content })
    });
    if (!res.ok) throw new Error(`${res.status}`);
    await fetchMessages();          // refresh immediately after send
  } catch {
    input.value = content;          // restore on failure
  } finally {
    input.disabled = false;
    input.focus();
  }
}

function handleChatKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Called by dashboard.js when Chat nav item is opened ───────

function onChatVisible() {
  unreadCount = 0;
  updateBadge();
  // Switch to fast poll while chat is open
  startPolling(POLL_ACTIVE);
  setTimeout(() => {
    const container = document.getElementById("chat-messages");
    if (container) container.scrollTop = container.scrollHeight;
    document.getElementById("chat-input")?.focus();
  }, 50);
}

// Called when user leaves chat section (optional — improves perf)
function onChatHidden() {
  startPolling(POLL_IDLE);
}

// ── Append a single message bubble ───────────────────────────

function appendMessage(msg, animate) {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  const isMine  = msg.user_id === myUserId;
  const color   = avatarColor(msg.user_id);
  const initial = (msg.user_name || "?").charAt(0).toUpperCase();
  const time    = formatChatTime(msg.created_at);

  const wrap = document.createElement("div");
  wrap.className = `chat-msg${isMine ? " chat-msg-mine" : ""}${animate ? " chat-msg-new" : ""}`;
  wrap.innerHTML = `
    ${!isMine ? `<div class="chat-avatar" style="background:${color}">${initial}</div>` : ""}
    <div class="chat-bubble-group">
      ${!isMine ? `<div class="chat-sender">${escapeHtml(msg.user_name)}</div>` : ""}
      <div class="chat-bubble">${escapeHtml(msg.content)}</div>
      <div class="chat-time">${time}</div>
    </div>
    ${isMine ? `<div class="chat-avatar chat-avatar-mine" style="background:${color}">${initial}</div>` : ""}
  `;
  container.appendChild(wrap);
}

// ── Helpers ───────────────────────────────────────────────────

function updateBadge() {
  const badge = document.getElementById("chat-nav-badge");
  if (!badge) return;
  badge.style.display = unreadCount > 0 ? "" : "none";
  badge.textContent   = unreadCount > 99 ? "99+" : String(unreadCount);
}

function setChatMessages(html) {
  const el = document.getElementById("chat-messages");
  if (el) el.innerHTML = html;
}

function setOnlineText(text) {
  const el = document.getElementById("chat-online-text");
  if (el) el.textContent = text;
}

function formatChatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
         d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

window.sendMessage   = sendMessage;
window.handleChatKey = handleChatKey;
window.onChatVisible = onChatVisible;
window.onChatHidden  = onChatHidden;

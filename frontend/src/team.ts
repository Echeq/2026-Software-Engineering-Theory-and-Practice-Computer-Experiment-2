export {};
const API_BASE_URL = `${window.location.origin}/api`;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

let currentUser: CurrentUser | null = null;

document.addEventListener("DOMContentLoaded", () => {
  void initTeamPage();
});

async function initTeamPage(): Promise<void> {
  initTheme();
  syncSidebarState();
  setupEventListeners();

  const token = getStoredToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  await loadCurrentUser();
  await loadMembers();
}

// ── Auth ────────────────────────────────────────────────────────────────────

function getStoredToken(): string {
  return localStorage.getItem("token")?.trim() || "";
}

function redirectToLogin(): void {
  window.location.href = "/";
}

function logout(): void {
  closeSidebar();
  localStorage.removeItem("token");
  void fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "same-origin" });
  redirectToLogin();
}

async function requestWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("X-CSRF-Token", token);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    logout();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(readMessage(data, "Request failed."));
  }

  return data as T;
}

// ── Data ────────────────────────────────────────────────────────────────────

async function loadCurrentUser(): Promise<void> {
  try {
    const data = await requestWithAuth<{ user: CurrentUser }>("/auth/me");
    currentUser = data.user;

    const nameEl = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    if (nameEl) nameEl.textContent = currentUser.name;
    if (avatarEl) avatarEl.textContent = getInitials(currentUser.name);

    if (currentUser.role === "manager") {
      const inviteBtn = document.getElementById("invite-member-btn") as HTMLButtonElement | null;
      if (inviteBtn) inviteBtn.hidden = false;
    }
  } catch {
    redirectToLogin();
  }
}

async function refreshMembers(): Promise<void> {
  try {
    const data = await requestWithAuth<{ users: TeamMember[] }>("/users");
    renderMembers(data.users);
  } catch (error) {
    showMessage(getErrorText(error, "Failed to refresh members."), "error");
  }
}

async function loadMembers(): Promise<void> {
  const list = document.getElementById("members-list")!;
  list.innerHTML = `<article class="state-card"><h3>Loading...</h3></article>`;

  try {
    const data = await requestWithAuth<{ users: TeamMember[] }>("/users");
    renderMembers(data.users);
  } catch (error) {
    showMessage(getErrorText(error, "Failed to load team members."), "error");
    list.innerHTML = `<article class="state-card"><h3>Could not load members</h3></article>`;
  }
}

function renderMembers(members: TeamMember[]): void {
  const list = document.getElementById("members-list")!;

  if (members.length === 0) {
    list.innerHTML = `<article class="state-card"><h3>No members yet</h3><p>Invite someone to get started.</p></article>`;
    return;
  }

  list.innerHTML = members.map((m) => {
    const isMe = m.id === currentUser?.id;
    const isManager = currentUser?.role === "manager";
    const roleBadge = m.role === "manager"
      ? `<span class="project-status" style="color:var(--accent)">Manager</span>`
      : `<span class="project-status">Member</span>`;

    const removeBtn = isManager && !isMe
      ? `<button type="button" class="secondary-button remove-member-btn" data-member-id="${escapeHtml(m.id)}" data-member-name="${escapeHtml(m.name)}" style="margin-top:12px;font-size:13px;">Remove</button>`
      : "";

    const youBadge = isMe ? ` <span style="font-size:12px;color:var(--muted)">(you)</span>` : "";

    return `
      <article class="project-card" style="cursor:default" data-member-card="${escapeHtml(m.id)}">
        <div class="project-head">
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(m.name)}${youBadge}</h3>
            <span class="project-task-count">${escapeHtml(m.email)}</span>
          </div>
          ${roleBadge}
        </div>
        <p class="project-description">Member since ${formatDate(m.created_at)}</p>
        ${removeBtn}
      </article>
    `;
  }).join("");

  document.querySelectorAll<HTMLButtonElement>(".remove-member-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.memberId!;
      const name = btn.dataset.memberName!;
      void confirmRemoveMember(id, name);
    });
  });
}

async function confirmRemoveMember(id: string, name: string): Promise<void> {
  if (!confirm(`Remove ${name} from the team? This cannot be undone.`)) return;
  await removeMember(id);
}

async function removeMember(id: string): Promise<void> {
  const card = document.querySelector<HTMLElement>(`[data-member-card="${id}"]`);
  if (card) {
    card.style.transition = "opacity 0.15s, transform 0.15s";
    card.style.opacity = "0";
    card.style.transform = "scale(0.97)";
  }

  try {
    await requestWithAuth(`/users/${id}`, { method: "DELETE" });
    card?.remove();
    showMessage("Member removed.", "success");
  } catch (error) {
    if (card) { card.style.opacity = "1"; card.style.transform = ""; }
    showMessage(getErrorText(error, "Failed to remove member."), "error");
  }
}

// ── Invite modal ─────────────────────────────────────────────────────────────

function openInviteModal(): void {
  const modal = document.getElementById("invite-modal")!;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  (document.getElementById("invite-name") as HTMLInputElement)?.focus();
}

function closeInviteModal(): void {
  const modal = document.getElementById("invite-modal")!;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  (document.getElementById("invite-form") as HTMLFormElement)?.reset();
  clearFieldErrors();
  setInviteSubmitting(false);
  document.getElementById("invite-form-message")!.textContent = "";
}

async function handleInviteSubmit(event: Event): Promise<void> {
  event.preventDefault();
  clearFieldErrors();

  const name = (document.getElementById("invite-name") as HTMLInputElement).value.trim();
  const email = (document.getElementById("invite-email") as HTMLInputElement).value.trim();
  const password = (document.getElementById("invite-password") as HTMLInputElement).value.trim();

  let valid = true;
  if (!name) { setFieldError("invite-name", "Name is required."); valid = false; }
  if (!email) { setFieldError("invite-email", "Email is required."); valid = false; }
  if (!password || password.length < 6) { setFieldError("invite-password", "Password must be at least 6 characters."); valid = false; }
  if (!valid) return;

  setInviteSubmitting(true);

  try {
    await requestWithAuth("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    closeInviteModal();
    showMessage(`${name} has been added to the team.`, "success");
    await refreshMembers();
  } catch (error) {
    document.getElementById("invite-form-message")!.textContent = getErrorText(error, "Failed to invite member.");
    (document.getElementById("invite-form-message")!).className = "form-message is-error";
    setInviteSubmitting(false);
  }
}

function setInviteSubmitting(submitting: boolean): void {
  const btn = document.getElementById("invite-submit-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = submitting;
    btn.textContent = submitting ? "Sending..." : "Send Invite";
  }
}

// ── Sidebar / theme ──────────────────────────────────────────────────────────

function initTheme(): void {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme((stored === "dark" || stored === "light" ? stored : preferred) as "light" | "dark");
}

function applyTheme(theme: "light" | "dark"): void {
  document.body.dataset.theme = theme;
  const btn = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function toggleTheme(): void {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next as "light" | "dark");
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_SIDEBAR_BREAKPOINT;
}

function syncSidebarState(): void {
  const sidebar = document.getElementById("dashboard-sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar || !toggleBtn || !backdrop) return;

  if (!isMobileViewport()) document.body.classList.remove("sidebar-open");
  const isOpen = !isMobileViewport() || document.body.classList.contains("sidebar-open");
  sidebar.setAttribute("aria-hidden", String(!isOpen));
  toggleBtn.setAttribute("aria-expanded", String(isMobileViewport() && document.body.classList.contains("sidebar-open")));
  backdrop.hidden = !(isMobileViewport() && document.body.classList.contains("sidebar-open"));
}

function openSidebar(): void {
  if (!isMobileViewport()) return;
  document.body.classList.add("sidebar-open");
  syncSidebarState();
}

function closeSidebar(): void {
  document.body.classList.remove("sidebar-open");
  syncSidebarState();
}

function toggleSidebar(): void {
  document.body.classList.contains("sidebar-open") ? closeSidebar() : openSidebar();
}

// ── Event listeners ──────────────────────────────────────────────────────────

function setupEventListeners(): void {
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("theme-toggle-btn")?.addEventListener("click", toggleTheme);
  document.getElementById("sidebar-toggle-btn")?.addEventListener("click", toggleSidebar);
  document.getElementById("sidebar-backdrop")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).dataset.closeSidebar === "true") closeSidebar();
  });
  document.getElementById("invite-member-btn")?.addEventListener("click", openInviteModal);
  document.getElementById("close-invite-modal")?.addEventListener("click", closeInviteModal);
  document.getElementById("cancel-invite-btn")?.addEventListener("click", closeInviteModal);
  document.getElementById("invite-form")?.addEventListener("submit", (e) => void handleInviteSubmit(e));
  document.getElementById("invite-modal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).dataset.closeModal === "true") closeInviteModal();
  });
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => { if (isMobileViewport()) closeSidebar(); });
  });
  window.addEventListener("resize", syncSidebarState);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("invite-modal");
      if (modal && !modal.hidden) { closeInviteModal(); return; }
      if (document.body.classList.contains("sidebar-open")) closeSidebar();
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function showMessage(text: string, type: "success" | "error"): void {
  const el = document.getElementById("team-message")!;
  el.textContent = text;
  el.className = `form-message ${type === "error" ? "is-error" : "is-success"}`;
  setTimeout(() => { el.textContent = ""; el.className = "form-message"; }, 4000);
}

function setFieldError(fieldId: string, message: string): void {
  const el = document.querySelector<HTMLElement>(`[data-error-for="${fieldId}"]`);
  if (el) { el.textContent = message; el.style.display = "block"; }
}

function clearFieldErrors(): void {
  document.querySelectorAll<HTMLElement>(".field-error").forEach((el) => {
    el.textContent = "";
    el.style.display = "";
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function readMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export {};

const API_BASE_URL = `${window.location.origin}/api`;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;

interface Project {
  id: string;
  name: string;
  status: string;
  owner_id: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

let currentUser: CurrentUser | null = null;
let allUsers: TeamMember[] = [];
let currentProjectId: string | null = null;

document.addEventListener("DOMContentLoaded", () => {
  void initTasksPage();
});

async function initTasksPage(): Promise<void> {
  initTheme();
  syncSidebarState();
  setupEventListeners();
  hydrateProjectContext();

  const token = getStoredToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  await loadCurrentUser();

  if (currentProjectId) {
    await Promise.all([loadUsers(), loadTasks()]);
  } else {
    await loadProjectSelector();
  }
}

// ── Project context ──────────────────────────────────────────────────────────

function hydrateProjectContext(): void {
  const params = new URLSearchParams(window.location.search);
  currentProjectId = params.get("projectId") || null;
  const projectName = params.get("projectName") || "No project selected";
  const status = params.get("status") || "";
  const creator = params.get("creator") || "";
  const createdAt = params.get("createdAt") || "";

  const nameEl = document.getElementById("selected-project-name");
  const metaEl = document.getElementById("selected-project-meta");
  const subtitleEl = document.getElementById("tasks-page-subtitle");
  const newTaskBtn = document.getElementById("new-task-btn") as HTMLButtonElement | null;

  if (nameEl) nameEl.textContent = projectName;
  if (metaEl && status) {
    metaEl.textContent = [status, creator, formatDate(createdAt)].filter(Boolean).join(" • ");
  }
  if (subtitleEl && currentProjectId) {
    subtitleEl.textContent = `Managing tasks for: ${projectName}`;
  }
  if (newTaskBtn && currentProjectId) {
    newTaskBtn.hidden = false;
  }
}

async function loadProjectSelector(): Promise<void> {
  const list = document.getElementById("tasks-list")!;
  list.innerHTML = `<article class="state-card"><h3>Loading projects...</h3></article>`;

  try {
    const data = await requestWithAuth<{ projects: Project[] }>("/projects");

    if (data.projects.length === 0) {
      list.innerHTML = `
        <article class="state-card">
          <h3>No projects yet</h3>
          <p>Create a project from the dashboard first, then come back to manage its tasks.</p>
        </article>`;
      return;
    }

    renderProjectSelector(data.projects);
  } catch (error) {
    list.innerHTML = `<article class="state-card"><h3>Could not load projects</h3><p>${escapeHtml(getErrorText(error, ""))}</p></article>`;
  }
}

function renderProjectSelector(projects: Project[]): void {
  const list = document.getElementById("tasks-list")!;

  const options = projects.map((p) =>
    `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${escapeHtml(capitalize(p.status))}</option>`
  ).join("");

  list.innerHTML = `
    <article class="project-card" style="grid-column:1/-1;cursor:default">
      <div class="project-head">
        <div class="project-title-wrap">
          <h3 class="project-name">Select a Project</h3>
          <span class="project-task-count">Choose which project to manage tasks for</span>
        </div>
      </div>
      <div class="form-group" style="margin-top:16px">
        <label for="project-selector" style="font-size:14px;font-weight:600;color:var(--muted)">Project</label>
        <select id="project-selector" style="margin-top:6px;width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:15px">
          <option value="">— pick a project —</option>
          ${options}
        </select>
      </div>
      <button type="button" id="load-project-tasks-btn" class="submit-button" style="margin-top:14px">Load Tasks</button>
    </article>`;

  document.getElementById("load-project-tasks-btn")?.addEventListener("click", () => {
    const select = document.getElementById("project-selector") as HTMLSelectElement;
    const selectedId = select.value;
    if (!selectedId) return;
    const selectedProject = projects.find((p) => p.id === selectedId)!;
    void selectProject(selectedProject);
  });
}

async function selectProject(project: Project): Promise<void> {
  currentProjectId = project.id;

  const nameEl = document.getElementById("selected-project-name");
  const subtitleEl = document.getElementById("tasks-page-subtitle");
  const newTaskBtn = document.getElementById("new-task-btn") as HTMLButtonElement | null;

  if (nameEl) nameEl.textContent = project.name;
  if (subtitleEl) subtitleEl.textContent = `Managing tasks for: ${project.name}`;
  if (newTaskBtn) newTaskBtn.hidden = false;

  await Promise.all([loadUsers(), loadTasks()]);
}

// ── Auth ────────────────────────────────────────────────────────────────────

function getStoredToken(): string {
  return localStorage.getItem("token")?.trim() || "";
}

function redirectToLogin(): void {
  window.location.href = "../index.html";
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
  } catch {
    redirectToLogin();
  }
}

async function loadUsers(): Promise<void> {
  try {
    const data = await requestWithAuth<{ users: TeamMember[] }>("/users");
    allUsers = data.users;
    populateAssigneeSelect();
  } catch {
    // non-critical — assignee select stays empty
  }
}

function populateAssigneeSelect(): void {
  const select = document.getElementById("task-assignee") as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = `<option value="">Unassigned</option>`;
  allUsers.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    select.appendChild(opt);
  });
}

async function loadTasks(): Promise<void> {
  if (!currentProjectId) return;
  const list = document.getElementById("tasks-list")!;
  list.innerHTML = `<article class="state-card"><h3>Loading tasks...</h3></article>`;

  try {
    const data = await requestWithAuth<{ tasks: Task[] }>(`/projects/${currentProjectId}/tasks`);
    renderTasks(data.tasks);
  } catch (error) {
    showMessage(getErrorText(error, "Failed to load tasks."), "error");
    list.innerHTML = `<article class="state-card"><h3>Could not load tasks</h3></article>`;
  }
}

async function refreshTasks(): Promise<void> {
  if (!currentProjectId) return;
  try {
    const data = await requestWithAuth<{ tasks: Task[] }>(`/projects/${currentProjectId}/tasks`);
    renderTasks(data.tasks);
  } catch (error) {
    showMessage(getErrorText(error, "Failed to refresh tasks."), "error");
  }
}

function renderTasks(tasks: Task[]): void {
  const list = document.getElementById("tasks-list")!;

  if (tasks.length === 0) {
    list.innerHTML = `
      <article class="state-card">
        <h3>No tasks yet</h3>
        <p>Click "Add Task" to create the first task for this project.</p>
      </article>`;
    return;
  }

  list.innerHTML = tasks.map((t) => {
    const assigneeName = t.assigned_to
      ? (allUsers.find((u) => u.id === t.assigned_to)?.name || "Unknown")
      : "Unassigned";

    const priorityColor = t.priority === "high"
      ? "var(--error)"
      : t.priority === "medium"
        ? "var(--warning)"
        : "var(--muted)";

    const dueDate = t.due_date ? `Due ${formatDate(t.due_date)}` : "";
    const statusDone = t.status === "completed";

    return `
      <article class="project-card" data-task-id="${escapeHtml(t.id)}">
        <div class="project-head">
          <div class="project-title-wrap">
            <h3 class="project-name" style="${statusDone ? "text-decoration:line-through;opacity:0.6" : ""}">${escapeHtml(t.title)}</h3>
            <span class="project-task-count">${escapeHtml(assigneeName)}</span>
          </div>
          <span class="project-status" style="color:${priorityColor}">${escapeHtml(capitalize(t.priority))}</span>
        </div>
        ${t.description ? `<p class="project-description">${escapeHtml(t.description)}</p>` : ""}
        <div class="project-meta" style="margin-top:12px;gap:8px;flex-wrap:wrap">
          <span class="status-badge" style="font-size:12px;padding:2px 8px;border-radius:6px;background:var(--surface-accent);color:var(--accent)">${escapeHtml(capitalize(t.status))}</span>
          ${dueDate ? `<span style="font-size:12px;color:var(--muted)">${escapeHtml(dueDate)}</span>` : ""}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button type="button" class="secondary-button toggle-status-btn" data-task-id="${escapeHtml(t.id)}" data-status="${escapeHtml(t.status)}" style="font-size:13px">
            ${statusDone ? "Reopen" : "Complete"}
          </button>
          <button type="button" class="secondary-button delete-task-btn" data-task-id="${escapeHtml(t.id)}" data-task-title="${escapeHtml(t.title)}" style="font-size:13px;color:var(--error)">Delete</button>
        </div>
      </article>`;
  }).join("");

  document.querySelectorAll<HTMLButtonElement>(".toggle-status-btn").forEach((btn) => {
    btn.addEventListener("click", () => void toggleTaskStatus(btn.dataset.taskId!, btn.dataset.status!));
  });

  document.querySelectorAll<HTMLButtonElement>(".delete-task-btn").forEach((btn) => {
    btn.addEventListener("click", () => void confirmDeleteTask(btn.dataset.taskId!, btn.dataset.taskTitle!));
  });
}

async function toggleTaskStatus(taskId: string, currentStatus: string): Promise<void> {
  const nextStatus = currentStatus === "completed" ? "pending" : "completed";
  const isDone = nextStatus === "completed";

  const card = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
  const btn = card?.querySelector<HTMLButtonElement>(".toggle-status-btn");
  const titleEl = card?.querySelector<HTMLElement>(".project-name");
  const badge = card?.querySelector<HTMLElement>(".status-badge");

  // Optimistic DOM update
  if (btn) { btn.disabled = true; btn.textContent = isDone ? "Reopen" : "Complete"; btn.dataset.status = nextStatus; }
  if (titleEl) titleEl.style.cssText = isDone ? "text-decoration:line-through;opacity:0.55" : "";
  if (badge) badge.textContent = capitalize(nextStatus);

  try {
    await requestWithAuth(`/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (btn) btn.disabled = false;
  } catch (error) {
    // Revert
    if (btn) { btn.disabled = false; btn.textContent = currentStatus === "completed" ? "Reopen" : "Complete"; btn.dataset.status = currentStatus; }
    if (titleEl) titleEl.style.cssText = currentStatus === "completed" ? "text-decoration:line-through;opacity:0.55" : "";
    if (badge) badge.textContent = capitalize(currentStatus);
    showMessage(getErrorText(error, "Failed to update task."), "error");
  }
}

async function confirmDeleteTask(taskId: string, title: string): Promise<void> {
  if (!confirm(`Delete task "${title}"? This cannot be undone.`)) return;

  const card = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
  if (card) {
    card.style.transition = "opacity 0.15s, transform 0.15s";
    card.style.opacity = "0";
    card.style.transform = "scale(0.97)";
  }

  try {
    await requestWithAuth(`/tasks/${taskId}`, { method: "DELETE" });
    card?.remove();
    showMessage("Task deleted.", "success");

    const list = document.getElementById("tasks-list")!;
    if (!list.querySelector("[data-task-id]")) {
      list.innerHTML = `
        <article class="state-card">
          <h3>No tasks yet</h3>
          <p>Click "Add Task" to create the first task for this project.</p>
        </article>`;
    }
  } catch (error) {
    if (card) { card.style.opacity = "1"; card.style.transform = ""; }
    showMessage(getErrorText(error, "Failed to delete task."), "error");
  }
}

// ── Task modal ───────────────────────────────────────────────────────────────

function openTaskModal(): void {
  const modal = document.getElementById("task-modal")!;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  (document.getElementById("task-title") as HTMLInputElement)?.focus();
}

function closeTaskModal(): void {
  const modal = document.getElementById("task-modal")!;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  (document.getElementById("task-form") as HTMLFormElement)?.reset();
  document.getElementById("task-form-message")!.textContent = "";
  clearFieldErrors();
  setTaskSubmitting(false);
}

async function handleTaskSubmit(event: Event): Promise<void> {
  event.preventDefault();
  clearFieldErrors();

  const title = (document.getElementById("task-title") as HTMLInputElement).value.trim();
  const description = (document.getElementById("task-description") as HTMLTextAreaElement).value.trim();
  const assignedTo = (document.getElementById("task-assignee") as HTMLSelectElement).value || null;
  const priority = (document.getElementById("task-priority") as HTMLSelectElement).value;
  const dueDate = (document.getElementById("task-due-date") as HTMLInputElement).value || null;

  if (!title) {
    setFieldError("task-title", "Title is required.");
    return;
  }

  setTaskSubmitting(true);

  try {
    await requestWithAuth("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        project_id: currentProjectId,
        assigned_to: assignedTo,
        priority,
        due_date: dueDate,
      }),
    });
    closeTaskModal();
    showMessage("Task created.", "success");
    await refreshTasks();
  } catch (error) {
    const msgEl = document.getElementById("task-form-message")!;
    msgEl.textContent = getErrorText(error, "Failed to create task.");
    msgEl.className = "form-message is-error";
    setTaskSubmitting(false);
  }
}

function setTaskSubmitting(submitting: boolean): void {
  const btn = document.getElementById("task-submit-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = submitting;
    btn.textContent = submitting ? "Creating..." : "Create Task";
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
  document.getElementById("new-task-btn")?.addEventListener("click", openTaskModal);
  document.getElementById("close-task-modal")?.addEventListener("click", closeTaskModal);
  document.getElementById("cancel-task-btn")?.addEventListener("click", closeTaskModal);
  document.getElementById("task-form")?.addEventListener("submit", (e) => void handleTaskSubmit(e));
  document.getElementById("task-modal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).dataset.closeModal === "true") closeTaskModal();
  });
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => { if (isMobileViewport()) closeSidebar(); });
  });
  window.addEventListener("resize", syncSidebarState);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("task-modal");
      if (modal && !modal.hidden) { closeTaskModal(); return; }
      if (document.body.classList.contains("sidebar-open")) closeSidebar();
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function showMessage(text: string, type: "success" | "error"): void {
  const el = document.getElementById("tasks-message")!;
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
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
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

import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, getProjects, getProjectTasks, getTaskTimeEntries, createTask, updateTask, deleteTask, addTimeEntry, deleteTimeEntry, isSessionError, logout } from "./core/services";

const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;
const TASK_CATEGORIES = ["design", "frontend", "backend", "database", "api", "testing", "bugfix", "refactoring", "documentation", "devops", "performance", "security", "research", "chore"];

interface CurrentUser {
  id: string; name: string; email: string;
}

interface TeamMember {
  id: string; name: string; email: string;
}

interface Project {
  id: string; name: string;
}

interface TaskItem {
  id: string; title: string; description: string | null; project_id: string;
  assigned_to: string | null; status: string; priority: string;
  due_date: string | null; tags: string; estimated_hours: number;
  created_at: string; updated_at: string;
}

interface TimeEntryItem {
  id: string; task_id: string; user_id: string; description: string | null;
  hours: number; date: string; created_at: string;
}

let currentUser: CurrentUser | null = null;
let projects: Project[] = [];
let members: TeamMember[] = [];
let currentProjectId = "";
let tasks: TaskItem[] = [];
let editingTaskId: string | null = null;

let userNameElement: HTMLElement | null;
let userAvatarElement: HTMLElement | null;
let logoutButton: HTMLButtonElement | null;
let themeToggleButton: HTMLButtonElement | null;
let sidebarToggleButton: HTMLButtonElement | null;
let sidebarElement: HTMLElement | null;
let sidebarBackdropElement: HTMLElement | null;
let projectSelect: HTMLSelectElement | null;
let tasksBoard: HTMLElement | null;
let tasksMessage: HTMLElement | null;
let taskModal: HTMLElement | null;
let taskModalTitle: HTMLElement | null;
let taskForm: HTMLFormElement | null;
let taskTitleInput: HTMLInputElement | null;
let taskDescInput: HTMLTextAreaElement | null;
let taskProjectSelect: HTMLSelectElement | null;
let taskAssigneeSelect: HTMLSelectElement | null;
let taskPrioritySelect: HTMLSelectElement | null;
let taskDueDateInput: HTMLInputElement | null;
let taskTagsContainer: HTMLElement | null;
let taskEstHoursInput: HTMLInputElement | null;
let taskFormMessage: HTMLElement | null;
let cancelTaskBtn: HTMLButtonElement | null;
let saveTaskBtn: HTMLButtonElement | null;
let timeEntriesSection: HTMLElement | null;
let timeEntriesList: HTMLElement | null;
let timeEntryForm: HTMLFormElement | null;
let timeEntryHours: HTMLInputElement | null;
let timeEntryDate: HTMLInputElement | null;
let timeEntryDesc: HTMLInputElement | null;

const selectedTags: Set<string> = new Set();

document.addEventListener("DOMContentLoaded", () => void initializeTasksPage());

async function initializeTasksPage(): Promise<void> {
  cacheElements();
  initTheme();
  syncSidebar();
  setupListeners();

  try {
    currentUser = await getCurrentUser();
    if (userNameElement) userNameElement.textContent = currentUser.name;
    if (userAvatarElement) userAvatarElement.textContent = getInitials(currentUser.name);
    projects = await getProjects();
    const allUsers = await fetchMembers();
    members = allUsers;
    populateProjectSelect();
    await loadInitialProject();
    await loadTasks();
    renderKanban();
  } catch (error) {
    if (isSessionError(error)) { redirectToLogin(); return; }
    showMessage("Failed to load page data", "error");
  }
}

function cacheElements(): void {
  userNameElement = document.getElementById("user-name");
  userAvatarElement = document.getElementById("user-avatar");
  logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
  themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
  sidebarElement = document.getElementById("dashboard-sidebar");
  sidebarBackdropElement = document.getElementById("sidebar-backdrop");
  projectSelect = document.getElementById("project-select") as HTMLSelectElement | null;
  tasksBoard = document.getElementById("tasks-board");
  tasksMessage = document.getElementById("tasks-message");
  taskModal = document.getElementById("task-modal");
  taskModalTitle = document.getElementById("task-modal-title");
  taskForm = document.getElementById("task-form") as HTMLFormElement | null;
  taskTitleInput = document.getElementById("task-title-input") as HTMLInputElement | null;
  taskDescInput = document.getElementById("task-desc-input") as HTMLTextAreaElement | null;
  taskProjectSelect = document.getElementById("task-project-select") as HTMLSelectElement | null;
  taskAssigneeSelect = document.getElementById("task-assignee-select") as HTMLSelectElement | null;
  taskPrioritySelect = document.getElementById("task-priority-select") as HTMLSelectElement | null;
  taskDueDateInput = document.getElementById("task-due-date-input") as HTMLInputElement | null;
  taskTagsContainer = document.getElementById("task-tags-container");
  taskEstHoursInput = document.getElementById("task-est-hours-input") as HTMLInputElement | null;
  taskFormMessage = document.getElementById("task-form-message");
  cancelTaskBtn = document.getElementById("cancel-task-btn") as HTMLButtonElement | null;
  saveTaskBtn = document.getElementById("save-task-btn") as HTMLButtonElement | null;
  timeEntriesSection = document.getElementById("time-entries-section");
  timeEntriesList = document.getElementById("time-entries-list");
  timeEntryForm = document.getElementById("time-entry-form") as HTMLFormElement | null;
  timeEntryHours = document.getElementById("time-entry-hours") as HTMLInputElement | null;
  timeEntryDate = document.getElementById("time-entry-date") as HTMLInputElement | null;
  timeEntryDesc = document.getElementById("time-entry-desc") as HTMLInputElement | null;
}

function setupListeners(): void {
  logoutButton?.addEventListener("click", handleLogout);
  themeToggleButton?.addEventListener("click", toggleTheme);
  sidebarToggleButton?.addEventListener("click", toggleSidebarFn);
  sidebarBackdropElement?.addEventListener("click", (e) => { if ((e.target as HTMLElement).dataset.closeSidebar === "true") closeSidebarFn(); });
  window.addEventListener("resize", syncSidebar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (taskModal && !taskModal.hidden) closeTaskModal();
      else if (document.body.classList.contains("sidebar-open")) closeSidebarFn();
    }
  });
  projectSelect?.addEventListener("change", async () => {
    currentProjectId = projectSelect!.value;
    await loadTasks();
    renderKanban();
  });
  document.getElementById("open-task-modal-btn")?.addEventListener("click", () => openTaskModal());
  cancelTaskBtn?.addEventListener("click", closeTaskModal);
  taskModal?.addEventListener("click", (e) => { if ((e.target as HTMLElement).dataset.closeModal === "true") closeTaskModal(); });
  taskForm?.addEventListener("submit", (e) => void handleTaskSubmit(e));
  timeEntryForm?.addEventListener("submit", (e) => void handleTimeEntrySubmit(e));
  document.getElementById("clear-task-filters-btn")?.addEventListener("click", () => {
    const p = document.getElementById("task-filter-priority") as HTMLSelectElement | null;
    const s = document.getElementById("task-filter-status") as HTMLSelectElement | null;
    if (p) p.value = "all";
    if (s) s.value = "all";
    const sort = document.getElementById("task-sort-select") as HTMLSelectElement | null;
    if (sort) sort.value = "created-desc";
    renderKanban();
  });
  document.getElementById("task-filter-priority")?.addEventListener("change", () => renderKanban());
  document.getElementById("task-filter-status")?.addEventListener("change", () => renderKanban());
  document.getElementById("task-sort-select")?.addEventListener("change", () => renderKanban());
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => { if (isMobileViewport()) closeSidebarFn(); });
  });
}

async function fetchMembers(): Promise<TeamMember[]> {
  try {
    const resp = await fetch("/api/users", { credentials: "same-origin" });
    if (resp.ok) { const data = await resp.json(); return data.users || []; }
  } catch { /* ignore */ }
  return [];
}

function populateProjectSelect(): void {
  if (!projectSelect) return;
  projectSelect.innerHTML = `<option value="">-- Select Project --</option>`;
  for (const p of projects) {
    projectSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
  }
}

async function loadInitialProject(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("projectId");
  if (projectId && projects.some(p => p.id === projectId)) {
    currentProjectId = projectId;
    if (projectSelect) projectSelect.value = projectId;
  } else if (projects.length > 0) {
    currentProjectId = projects[0].id;
    if (projectSelect) projectSelect.value = projects[0].id;
  }
}

async function loadTasks(): Promise<void> {
  if (!currentProjectId) { tasks = []; return; }
  try {
    tasks = await getProjectTasks(currentProjectId) as TaskItem[];
  } catch { tasks = []; showMessage("Failed to load tasks", "error"); }
}

function renderKanban(): void {
  if (!tasksBoard) return;
  if (!currentProjectId) {
    tasksBoard.innerHTML = `<article class="state-card"><h3>Select a project</h3><p>Choose a project from the dropdown to view its tasks.</p></article>`;
    return;
  }
  const priorityFilter = (document.getElementById("task-filter-priority") as HTMLSelectElement)?.value || "all";
  const statusFilter = (document.getElementById("task-filter-status") as HTMLSelectElement)?.value || "all";
  const sortValue = (document.getElementById("task-sort-select") as HTMLSelectElement)?.value || "created-desc";

  let filtered = [...tasks];
  if (priorityFilter !== "all") filtered = filtered.filter(t => t.priority?.toLowerCase() === priorityFilter.toLowerCase());
  if (statusFilter !== "all") filtered = filtered.filter(t => t.status === statusFilter);

  const memberMap = new Map(members.map(m => [m.id, m.name]));
  if (currentUser) memberMap.set(currentUser.id, currentUser.name);

  filtered.sort((a, b) => {
    if (sortValue === "created-asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortValue === "created-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortValue === "due-asc") return (a.due_date || "").localeCompare(b.due_date || "");
    if (sortValue === "due-desc") return (b.due_date || "").localeCompare(a.due_date || "");
    if (sortValue === "priority-desc") {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority?.toLowerCase()] ?? 1) - (order[b.priority?.toLowerCase()] ?? 1);
    }
    return 0;
  });

  const columns = [
    { status: "pending", title: i18n("tasks.status.todo") },
    { status: "in-progress", title: i18n("tasks.status.inProgress") },
    { status: "in review", title: "In Review" },
    { status: "done", title: i18n("tasks.status.done") },
  ];

  let html = `<div class="kanban-board" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">`;
  for (const col of columns) {
    const colTasks = filtered.filter(t => t.status === col.status || (!col.status && !t.status));
    html += `<div class="kanban-column" style="background:var(--surface);border-radius:12px;padding:16px;">
      <h3 style="margin:0 0 12px;font-size:15px;">${escapeHtml(col.title)} <span style="font-weight:400;color:var(--muted)">(${colTasks.length})</span></h3>
      ${colTasks.length === 0 ? `<p style="color:var(--muted);font-size:13px;">No tasks</p>` : ""}
      ${colTasks.map(t => renderTaskCard(t, memberMap)).join("")}
    </div>`;
  }
  html += `</div>`;
  tasksBoard.innerHTML = html;

  document.querySelectorAll<HTMLButtonElement>(".task-status-btn").forEach(btn => {
    btn.addEventListener("click", () => void moveTask(btn.dataset.taskId!, btn.dataset.status!));
  });
  document.querySelectorAll<HTMLButtonElement>(".task-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openTaskModal(btn.dataset.taskId!));
  });
  document.querySelectorAll<HTMLButtonElement>(".task-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => void deleteTaskHandler(btn.dataset.taskId!));
  });
}

function renderTaskCard(t: TaskItem, memberMap: Map<string, string>): string {
  let tags: string[] = [];
  try { tags = JSON.parse(t.tags || "[]"); } catch { tags = []; }
  const priorityColors: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  const assigneeName = t.assigned_to ? memberMap.get(t.assigned_to) || "Unknown" : "Unassigned";
  return `
    <article class="project-card" style="margin-bottom:12px;cursor:default;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <h4 style="margin:0;font-size:14px;flex:1;">${escapeHtml(t.title)}</h4>
        <span style="background:${priorityColors[t.priority?.toLowerCase()] || "#94a3b8"};color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;white-space:nowrap;">${escapeHtml(t.priority || "medium")}</span>
      </div>
      ${t.description ? `<p style="font-size:13px;color:var(--muted);margin:0 0 8px;">${escapeHtml(t.description)}</p>` : ""}
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
        ${tags.map(tag => `<span style="background:var(--surface-border);border-radius:4px;padding:1px 8px;font-size:11px;">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted);">
        <span>👤 ${escapeHtml(assigneeName)}</span>
        ${t.due_date ? `<span>📅 ${escapeHtml(t.due_date)}</span>` : ""}
        ${t.estimated_hours > 0 ? `<span>⏱ ${t.estimated_hours}h</span>` : ""}
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button class="secondary-button task-status-btn" data-task-id="${t.id}" data-status="pending" style="font-size:11px;padding:2px 8px;">To-Do</button>
        <button class="secondary-button task-status-btn" data-task-id="${t.id}" data-status="in-progress" style="font-size:11px;padding:2px 8px;">In Progress</button>
        <button class="secondary-button task-status-btn" data-task-id="${t.id}" data-status="done" style="font-size:11px;padding:2px 8px;">Done</button>
        <button class="secondary-button task-edit-btn" data-task-id="${t.id}" style="font-size:11px;padding:2px 8px;">Edit</button>
        <button class="secondary-button task-delete-btn" data-task-id="${t.id}" style="font-size:11px;padding:2px 8px;color:#ef4444;">Delete</button>
      </div>
    </article>
  `;
}

async function moveTask(taskId: string, newStatus: string): Promise<void> {
  try {
    await updateTask(taskId, { status: newStatus });
    await loadTasks();
    renderKanban();
  } catch { showMessage("Failed to update task status", "error"); }
}

async function deleteTaskHandler(taskId: string): Promise<void> {
  if (!confirm("Delete this task?")) return;
  try {
    await deleteTask(taskId);
    await loadTasks();
    renderKanban();
    showMessage("Task deleted", "success");
  } catch { showMessage("Failed to delete task", "error"); }
}

function openTaskModal(taskId?: string): void {
  if (!taskModal) return;
  editingTaskId = taskId || null;
  selectedTags.clear();
  resetTaskForm();

  if (taskProjectSelect) {
    taskProjectSelect.innerHTML = `<option value="">-- Select Project --</option>`;
    for (const p of projects) {
      taskProjectSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
    }
  }
  if (taskAssigneeSelect) {
    taskAssigneeSelect.innerHTML = `<option value="">Unassigned</option>`;
    if (currentUser) taskAssigneeSelect.innerHTML += `<option value="${currentUser.id}">${escapeHtml(currentUser.name)} (me)</option>`;
    for (const m of members) {
      if (m.id !== currentUser?.id) taskAssigneeSelect.innerHTML += `<option value="${m.id}">${escapeHtml(m.name)}</option>`;
    }
  }
  renderTagCheckboxes();

  if (taskId) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    if (taskModalTitle) taskModalTitle.textContent = "Edit Task";
    if (saveTaskBtn) saveTaskBtn.textContent = "Update Task";
    if (taskTitleInput) taskTitleInput.value = t.title;
    if (taskDescInput) taskDescInput.value = t.description || "";
    if (taskProjectSelect) taskProjectSelect.value = t.project_id;
    if (taskAssigneeSelect) taskAssigneeSelect.value = t.assigned_to || "";
    if (taskPrioritySelect) taskPrioritySelect.value = t.priority || "medium";
    if (taskDueDateInput) taskDueDateInput.value = t.due_date || "";
    if (taskEstHoursInput) taskEstHoursInput.value = String(t.estimated_hours || 0);
    try {
      const existingTags: string[] = JSON.parse(t.tags || "[]");
      existingTags.forEach(tag => selectedTags.add(tag));
    } catch { /* ignore */ }
    renderTagCheckboxes();
    renderTimeEntries(taskId);
    if (timeEntriesSection) timeEntriesSection.hidden = false;
  } else {
    if (taskModalTitle) taskModalTitle.textContent = "Create Task";
    if (saveTaskBtn) saveTaskBtn.textContent = "Save Task";
    if (taskProjectSelect) taskProjectSelect.value = currentProjectId;
    if (taskPrioritySelect) taskPrioritySelect.value = "medium";
    if (taskDueDateInput) taskDueDateInput.value = "";
    if (taskEstHoursInput) taskEstHoursInput.value = "0";
    if (timeEntriesSection) timeEntriesSection.hidden = true;
  }
  taskModal.hidden = false;
  taskModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  taskTitleInput?.focus();
}

function closeTaskModal(): void {
  if (!taskModal) return;
  taskModal.hidden = true;
  taskModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  editingTaskId = null;
}

function resetTaskForm(): void {
  if (taskForm) taskForm.reset();
  if (taskFormMessage) taskFormMessage.textContent = "";
}

function renderTagCheckboxes(): void {
  if (!taskTagsContainer) return;
  taskTagsContainer.innerHTML = TASK_CATEGORIES.map(tag => `
    <label style="display:inline-flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;">
      <input type="checkbox" value="${tag}" ${selectedTags.has(tag) ? "checked" : ""} style="accent-color:#6366f1;">
      ${escapeHtml(tag)}
    </label>
  `).join("");
  taskTagsContainer.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) selectedTags.add(cb.value);
      else selectedTags.delete(cb.value);
    });
  });
}

async function handleTaskSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const title = taskTitleInput?.value.trim();
  if (!title) { showTaskFormMessage("Title is required", "error"); return; }
  const projectId = taskProjectSelect?.value;
  if (!projectId) { showTaskFormMessage("Project is required", "error"); return; }

  const body: any = { title };
  if (taskDescInput?.value.trim()) body.description = taskDescInput.value.trim();
  if (taskAssigneeSelect?.value) body.assigned_to = taskAssigneeSelect.value;
  if (taskPrioritySelect?.value) body.priority = taskPrioritySelect.value;
  if (taskDueDateInput?.value) body.due_date = taskDueDateInput.value;
  if (projectId) body.project_id = projectId;
  body.tags = JSON.stringify([...selectedTags]);
  body.estimated_hours = parseFloat(taskEstHoursInput?.value || "0") || 0;

  try {
    if (editingTaskId) {
      await updateTask(editingTaskId, body);
      showMessage("Task updated", "success");
    } else {
      await createTask(body);
      showMessage("Task created", "success");
    }
    closeTaskModal();
    await loadTasks();
    renderKanban();
  } catch (error: any) {
    showTaskFormMessage(error?.message || "Failed to save task", "error");
  }
}

async function renderTimeEntries(taskId: string): Promise<void> {
  if (!timeEntriesList) return;
  try {
    const entries = await getTaskTimeEntries(taskId);
    if (entries.length === 0) {
      timeEntriesList.innerHTML = `<p style="color:var(--muted);font-size:13px;">No time entries yet.</p>`;
    } else {
      const total = entries.reduce((s, e) => s + e.hours, 0);
      timeEntriesList.innerHTML = entries.map(e => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--surface-border);font-size:13px;">
          <div>
            <strong>${escapeHtml(e.date)}</strong> — ${e.hours}h
            ${e.description ? `<br><span style="color:var(--muted)">${escapeHtml(e.description)}</span>` : ""}
          </div>
          <button class="secondary-button del-time-btn" data-entry-id="${e.id}" style="font-size:11px;padding:2px 8px;color:#ef4444;">Delete</button>
        </div>
      `).join("") + `<div style="padding:8px 0;font-weight:600;font-size:13px;">Total: ${total}h</div>`;
    }
    timeEntriesList.querySelectorAll<HTMLButtonElement>(".del-time-btn").forEach(btn => {
      btn.addEventListener("click", () => void deleteTimeEntryHandler(btn.dataset.entryId!));
    });
  } catch { timeEntriesList.innerHTML = `<p style="color:var(--muted);font-size:13px;">Could not load time entries.</p>`; }
}

async function handleTimeEntrySubmit(event: Event): Promise<void> {
  event.preventDefault();
  if (!editingTaskId || !timeEntryHours || !timeEntryDate) return;
  const hours = parseFloat(timeEntryHours.value);
  if (!hours || hours <= 0) { showTaskFormMessage("Hours must be greater than 0", "error"); return; }
  if (!timeEntryDate.value) { showTaskFormMessage("Date is required", "error"); return; }
  try {
    await addTimeEntry({ task_id: editingTaskId, hours, date: timeEntryDate.value, description: timeEntryDesc?.value?.trim() || undefined });
    timeEntryForm?.reset();
    await renderTimeEntries(editingTaskId);
    showMessage("Time entry added", "success");
  } catch (error: any) {
    showTaskFormMessage(error?.message || "Failed to add time entry", "error");
  }
}

async function deleteTimeEntryHandler(entryId: string): Promise<void> {
  if (!confirm("Delete this time entry?")) return;
  try {
    await deleteTimeEntry(entryId);
    if (editingTaskId) await renderTimeEntries(editingTaskId);
  } catch { showMessage("Failed to delete time entry", "error"); }
}

function showMessage(text: string, type: "success" | "error"): void {
  if (!tasksMessage) return;
  tasksMessage.textContent = text;
  tasksMessage.className = `form-message ${type === "error" ? "is-error" : "is-success"}`;
  setTimeout(() => { tasksMessage!.textContent = ""; tasksMessage!.className = "form-message"; }, 4000);
}

function showTaskFormMessage(text: string, type: "success" | "error" | "" = ""): void {
  if (!taskFormMessage) return;
  taskFormMessage.textContent = text;
  taskFormMessage.className = type ? `form-message ${type === "error" ? "is-error" : "is-success"}` : "form-message";
}

function redirectToLogin(): void { window.location.href = "/"; }
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function handleLogout(): Promise<void> { closeSidebarFn(); await logout(); redirectToLogin(); }

function isMobileViewport(): boolean { return window.innerWidth <= MOBILE_SIDEBAR_BREAKPOINT; }
function syncSidebar(): void {
  if (!sidebarElement || !sidebarToggleButton || !sidebarBackdropElement) return;
  if (!isMobileViewport()) document.body.classList.remove("sidebar-open");
  const isOpen = !isMobileViewport() || document.body.classList.contains("sidebar-open");
  sidebarElement.setAttribute("aria-hidden", String(!isOpen));
  sidebarToggleButton.setAttribute("aria-expanded", String(isMobileViewport() && document.body.classList.contains("sidebar-open")));
  sidebarBackdropElement.hidden = !(isMobileViewport() && document.body.classList.contains("sidebar-open"));
}
function openSidebarFn(): void { if (!isMobileViewport()) return; document.body.classList.add("sidebar-open"); syncSidebar(); }
function closeSidebarFn(): void { document.body.classList.remove("sidebar-open"); syncSidebar(); }
function toggleSidebarFn(): void { document.body.classList.contains("sidebar-open") ? closeSidebarFn() : openSidebarFn(); }

function initTheme(): void {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme((stored === "dark" || stored === "light" ? stored : preferred) as "light" | "dark");
}
function applyTheme(theme: "light" | "dark"): void {
  document.body.dataset.theme = theme;
  if (!themeToggleButton) return;
  themeToggleButton.textContent = theme === "dark" ? i18n("theme.light") : i18n("theme.dark");
  themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
}
function toggleTheme(): void {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next as "light" | "dark");
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, getProjects, getProjectTasks, createTask, updateTask, deleteTask, isSessionError, logout } from "./core/services";

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
    showMessage(i18n("tasks.failedLoadPage"), "error");
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
  projectSelect.innerHTML = `<option value="">${i18n("tasks.selectProject")}</option>`;
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
  } catch { tasks = []; showMessage(i18n("tasks.failedLoadTasks"), "error"); }
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
    { status: "in review", title: i18n("tasks.status.inReview") },
    { status: "done", title: i18n("tasks.status.done") },
  ];

  let html = `<div class="kanban-board">`;
  for (const col of columns) {
    const colTasks = filtered.filter(t => t.status === col.status || (!col.status && !t.status));
    html += `<div class="kanban-column" data-column-status="${col.status}" style="background:var(--surface);border-radius:12px;padding:16px;">
      <h3 style="margin:0 0 12px;font-size:15px;">${escapeHtml(col.title)} <span style="font-weight:400;color:var(--muted)">(${colTasks.length})</span></h3>
      ${colTasks.length === 0 ? `<p style="color:var(--muted);font-size:13px;">${i18n("tasks.noTasks")}</p>` : ""}
      ${colTasks.map(t => renderTaskCard(t, memberMap)).join("")}
    </div>`;
  }
  html += `</div>`;
  tasksBoard.innerHTML = html;

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouch) {
    attachMobilePicker();
  } else {
    attachDragDrop();
  }
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
  const assigneeName = t.assigned_to ? memberMap.get(t.assigned_to) || i18n("tasks.unknown") : i18n("tasks.unassigned");
  return `
    <article class="project-card task-card-draggable" draggable="true" data-task-id="${t.id}" style="margin-bottom:12px;cursor:grab;padding:14px;">
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
        <button class="secondary-button task-edit-btn" data-task-id="${t.id}" style="font-size:11px;padding:2px 8px;">${i18n("tasks.edit")}</button>
        <button class="secondary-button task-delete-btn" data-task-id="${t.id}" style="font-size:11px;padding:2px 8px;color:#ef4444;">${i18n("tasks.delete")}</button>
      </div>
    </article>
  `;
}

function attachDragDrop(): void {
  const cards = document.querySelectorAll<HTMLElement>(".task-card-draggable");
  const columns = document.querySelectorAll<HTMLElement>(".kanban-column");

  cards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      const dt = e.dataTransfer;
      if (dt) {
        dt.effectAllowed = "move";
        dt.setData("text/plain", card.dataset.taskId || "");
      }
      card.style.opacity = "0.4";
    });
    card.addEventListener("dragend", () => {
      card.style.opacity = "";
    });
  });

  columns.forEach(col => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      col.classList.add("kanban-column-drag-over");
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("kanban-column-drag-over");
    });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("kanban-column-drag-over");
      const taskId = e.dataTransfer?.getData("text/plain");
      const newStatus = col.dataset.columnStatus;
      if (taskId && newStatus) void moveTask(taskId, newStatus);
    });
  });
}

function attachMobilePicker(): void {
  const cards = document.querySelectorAll<HTMLElement>(".task-card-draggable");
  let pickerEl = document.getElementById("mobile-status-picker");

  if (!pickerEl) {
    pickerEl = document.createElement("div");
    pickerEl.id = "mobile-status-picker";
    pickerEl.setAttribute("role", "dialog");
    pickerEl.style.cssText = "display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);align-items:flex-end;justify-content:center;";
    document.body.appendChild(pickerEl);
    const sheet = document.createElement("div");
    sheet.style.cssText = "background:var(--surface,#fff);border-radius:20px 20px 0 0;padding:24px 20px;width:100%;max-width:480px;box-shadow:0 -4px 24px rgba(0,0,0,0.15);";
    sheet.innerHTML = `<h3 style="margin:0 0 16px;font-size:18px;font-weight:600;">${i18n("tasks.changeStatus")}</h3>`;
    const statuses = [
      { status: "pending", label: i18n("tasks.status.todo"), color: "#6366f1" },
      { status: "in-progress", label: i18n("tasks.status.inProgress"), color: "#f59e0b" },
      { status: "in review", label: i18n("tasks.status.inReview"), color: "#8b5cf6" },
      { status: "done", label: i18n("tasks.status.done"), color: "#22c55e" },
    ];
    for (const s of statuses) {
      const btn = document.createElement("button");
      btn.className = "picker-status-btn";
      btn.dataset.status = s.status;
      btn.textContent = s.label;
      btn.style.cssText = `display:block;width:100%;margin-bottom:8px;padding:16px;font-size:16px;font-weight:600;border:none;border-radius:12px;background:${s.color};color:#fff;cursor:pointer;`;
      sheet.appendChild(btn);
    }
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = i18n("tasks.cancel");
    cancelBtn.style.cssText = "display:block;width:100%;padding:16px;font-size:16px;border:none;border-radius:12px;background:var(--surface-border,#e5e7eb);color:var(--text,#111);cursor:pointer;";
    sheet.appendChild(cancelBtn);
    pickerEl.appendChild(sheet);

    pickerEl.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".picker-status-btn");
      if (btn) {
        const status = btn.dataset.status;
        const taskId = pickerEl!.dataset.taskId;
        if (status && taskId) void moveTask(taskId, status);
        pickerEl!.style.display = "none";
        pickerEl!.dataset.taskId = "";
      } else if ((e.target as HTMLElement) === pickerEl || (e.target as HTMLElement).textContent === "Cancel") {
        pickerEl!.style.display = "none";
        pickerEl!.dataset.taskId = "";
      }
    });
  }

  cards.forEach(card => {
    card.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (pickerEl) {
        pickerEl.style.display = "flex";
        pickerEl.dataset.taskId = card.dataset.taskId || "";
      }
    });
  });
}

async function moveTask(taskId: string, newStatus: string): Promise<void> {
  try {
    await updateTask(taskId, { status: newStatus });
    await loadTasks();
    renderKanban();
  } catch { showMessage(i18n("tasks.failedUpdateStatus"), "error"); }
}

async function deleteTaskHandler(taskId: string): Promise<void> {
  if (!confirm(i18n("tasks.confirmDelete"))) return;
  try {
    await deleteTask(taskId);
    await loadTasks();
    renderKanban();
    showMessage(i18n("tasks.taskDeleted"), "success");
  } catch { showMessage(i18n("tasks.failedDeleteTask"), "error"); }
}

function openTaskModal(taskId?: string): void {
  if (!taskModal) return;
  editingTaskId = taskId || null;
  selectedTags.clear();
  resetTaskForm();

  if (taskProjectSelect) {
    taskProjectSelect.innerHTML = `<option value="">${i18n("tasks.selectProject")}</option>`;
    for (const p of projects) {
      taskProjectSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
    }
  }
  if (taskAssigneeSelect) {
    taskAssigneeSelect.innerHTML = `<option value="">${i18n("tasks.unassigned")}</option>`;
    if (currentUser) taskAssigneeSelect.innerHTML += `<option value="${currentUser.id}">${escapeHtml(currentUser.name)} ${i18n("tasks.me")}</option>`;
    for (const m of members) {
      if (m.id !== currentUser?.id) taskAssigneeSelect.innerHTML += `<option value="${m.id}">${escapeHtml(m.name)}</option>`;
    }
  }
  renderTagCheckboxes();

  if (taskId) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    if (taskModalTitle) taskModalTitle.textContent = i18n("tasks.editTask");
    if (saveTaskBtn) saveTaskBtn.textContent = i18n("tasks.updateTask");
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
  } else {
    if (taskModalTitle) taskModalTitle.textContent = i18n("tasks.createTask");
    if (saveTaskBtn) saveTaskBtn.textContent = i18n("tasks.saveTask");
    if (taskProjectSelect) taskProjectSelect.value = currentProjectId;
    if (taskPrioritySelect) taskPrioritySelect.value = "medium";
    if (taskDueDateInput) taskDueDateInput.value = "";
    if (taskEstHoursInput) taskEstHoursInput.value = "0";
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
  if (!title) { showTaskFormMessage(i18n("tasks.validation.titleRequired"), "error"); return; }
  const projectId = taskProjectSelect?.value;
  if (!projectId) { showTaskFormMessage(i18n("tasks.validation.projectRequired"), "error"); return; }

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
      showMessage(i18n("tasks.taskUpdated"), "success");
    } else {
      await createTask(body);
      showMessage(i18n("tasks.taskCreated"), "success");
    }
    closeTaskModal();
    await loadTasks();
    renderKanban();
  } catch (error: any) {
    showTaskFormMessage(error?.message || i18n("tasks.failedSaveTask"), "error");
  }
}

function showMessage(text: string, type: "success" | "error"): void {
  if (!tasksMessage) return;
  const item = document.createElement("div");
  item.className = `notification-item ${type === "error" ? "is-error" : "is-success"}`;
  const span = document.createElement("span");
  span.textContent = text;
  const closeBtn = document.createElement("button");
  closeBtn.className = "notification-close";
  closeBtn.textContent = "\u00d7";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  item.appendChild(span);
  item.appendChild(closeBtn);
  tasksMessage.appendChild(item);
  const timer = setTimeout(() => { if (item.parentNode) item.remove(); }, 4000);
  closeBtn.addEventListener("click", () => { clearTimeout(timer); item.remove(); });
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

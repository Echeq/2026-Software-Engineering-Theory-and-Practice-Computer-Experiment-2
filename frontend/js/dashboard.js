const API_BASE_URL = "http://localhost:3000/api";

let currentUser = null;
let allUsers = [];
let usersById = {};
let projectsById = {};
let allTasksCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  checkAuthentication();
  setupEventListeners();
  await Promise.all([loadUserData(), loadUsers()]);
  showSection("overview");

  // Members display is independent — not gated on tasks loading
  if (currentUser && currentUser.role === "manager") {
    displayMembers(allUsers);
  }

  loadProjects();
  loadTasks();
});

function checkAuthentication() {
  if (!localStorage.getItem("token")) window.location.href = "../index.html";
}

// ── Data loading ──────────────────────────────────────────────

async function loadUserData() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) { logout(); return; }
    if (!res.ok) return;
    const data = await res.json();
    currentUser = data.user;

    const nameEl   = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    const roleEl   = document.getElementById("user-role-label");
    if (nameEl)   nameEl.textContent   = currentUser.name;
    if (avatarEl) avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    if (roleEl)   roleEl.textContent   = capitalize(currentUser.role);

    if (currentUser.role === "manager") {
      const addBtn = document.getElementById("add-member-btn");
      if (addBtn) addBtn.style.display = "inline-flex";
      const navTeam = document.querySelector(".nav-item-members");
      if (navTeam) navTeam.style.display = "flex";
    }

    renderWelcomeCard();
  } catch (e) { console.error("loadUserData:", e); }
}

async function loadUsers() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    allUsers = data.users || [];
    usersById = Object.fromEntries(allUsers.map(u => [u.id, u]));
  } catch (e) { console.error("loadUsers:", e); }
}

async function loadProjects() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const projects = data.projects || [];
    projectsById = Object.fromEntries(projects.map(p => [p.id, p]));
    displayProjects(projects);
    animateCounter(document.getElementById("stat-projects"), projects.length);
  } catch {
    showRetryError("projects-list", loadProjects);
  }
}

async function loadTasks() {
  const isManager = currentUser?.role === "manager";
  try {
    const token = localStorage.getItem("token");
    const endpoint = isManager ? `${API_BASE_URL}/tasks` : `${API_BASE_URL}/tasks/my-tasks`;
    const res = await fetch(endpoint, { headers: { "Authorization": `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    allTasksCache = data.tasks || [];
    displayTasks(allTasksCache, isManager);
    updateTaskStats(allTasksCache);

    // Update stat label for manager
    const label = document.getElementById("stat-tasks-label");
    if (label) label.textContent = isManager ? "All Tasks" : "My Tasks";
  } catch (err) {
    console.error("loadTasks failed:", err);
    showRetryError("tasks-list", loadTasks, isManager
      ? "Could not load project tasks. Make sure the server is running, then retry."
      : "Could not load your tasks. Please retry.");
  }
}

// ── Display ───────────────────────────────────────────────────

function renderWelcomeCard() {
  if (!currentUser) return;
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
  const now = new Date();
  const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  setText("welcome-greeting",  greeting);
  setText("welcome-name-big",  currentUser.name.split(" ")[0]);
  setText("welcome-sub", currentUser.role === "manager"
    ? "Here's your team's project overview."
    : "Here's a summary of your assigned work.");
  setText("welcome-day",      DAYS[now.getDay()]);
  setText("welcome-datestr",  `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);
}

function displayProjects(projects) {
  const el = document.getElementById("projects-list");
  if (!el) return;
  if (!projects.length) {
    el.innerHTML = richEmpty(
      `<path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
      "No projects yet", "Create your first project to get started."
    );
    return;
  }
  const isManager = currentUser?.role === "manager";
  el.innerHTML = projects.map(p => {
    const color = projectColor(p.id);
    const statusOptions = ['active','completed','archived'].map(s =>
      `<option value="${s}"${p.status === s ? " selected" : ""}>${capitalize(s)}</option>`
    ).join("");
    return `
    <div class="project-card" style="--project-color:${color}">
      <div class="project-card-header">
        <span class="project-status-dot status-dot-${p.status}"></span>
        ${isManager
          ? `<select class="project-status-select" onchange="changeProjectStatus('${p.id}',this.value)">${statusOptions}</select>`
          : `<span class="project-status-label">${p.status}</span>`
        }
      </div>
      <h3 class="project-name">${escapeHtml(p.name)}</h3>
      ${p.description ? `<p class="project-description">${escapeHtml(p.description)}</p>` : '<p class="project-description empty-desc">No description</p>'}
      <div class="project-footer">
        <button class="btn btn-small btn-outline" onclick="openTaskModal('${p.id}')">+ Add Task</button>
        <button class="btn btn-small btn-danger-ghost" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}

function displayTasks(tasks, isManager) {
  const el = document.getElementById("tasks-list");
  if (!el) return;

  // Update heading
  setText(document.querySelector("#tasks .section-title"), isManager ? "All Project Tasks" : "My Tasks");
  const navLabel = document.querySelector("a[href='#tasks'] .nav-label");
  if (navLabel) navLabel.textContent = isManager ? "All Tasks" : "My Tasks";

  if (!tasks.length) {
    const msg  = isManager ? "No tasks in your projects yet" : "No tasks assigned to you yet";
    const hint = isManager ? "Add a task from the Projects section." : "Your manager will assign tasks to you.";
    el.innerHTML = richEmpty(`<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`, msg, hint);
    return;
  }

  const now = new Date(); now.setHours(0,0,0,0);
  el.innerHTML = tasks.map(t => {
    const overdue  = t.due_date && t.status !== "completed" && new Date(t.due_date).setHours(0,0,0,0) < now.getTime();
    const done     = t.status === "completed";
    const pName    = projectsById[t.project_id]?.name ?? "Unknown Project";
    const pColor   = projectsById[t.project_id] ? projectColor(t.project_id) : "#6366f1";
    const assignee = t.assigned_to ? usersById[t.assigned_to]?.name : null;
    return `
    <div class="task-item${overdue?" overdue":""}${done?" is-completed":""} priority-${t.priority}-item" data-task-id="${t.id}">
      <div class="task-info">
        <div class="task-chips">
          <span class="task-project-chip" style="background:${pColor}18;color:${pColor}">${escapeHtml(pName)}</span>
          <span class="priority-badge priority-${t.priority}">${t.priority}</span>
          ${assignee ? `<span class="task-assignee-chip">${escapeHtml(assignee)}</span>` : ""}
        </div>
        <h4 class="task-title">${escapeHtml(t.title)}</h4>
        ${t.description ? `<p class="task-description">${escapeHtml(t.description)}</p>` : ""}
        ${t.due_date ? `<span class="due-date${overdue?" is-overdue":""}">Due ${formatDate(t.due_date)}</span>` : ""}
      </div>
      <div class="task-actions">
        ${isManager ? `<button class="btn-icon-edit" onclick="openEditTaskModal('${t.id}')" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>` : ""}
        <select onchange="updateTaskStatus('${t.id}',this.value)" class="status-select status-${t.status}">
          <option value="pending"${t.status==="pending"?" selected":""}>Pending</option>
          <option value="in-progress"${t.status==="in-progress"?" selected":""}>In Progress</option>
          <option value="completed"${t.status==="completed"?" selected":""}>Completed</option>
        </select>
      </div>
    </div>`;
  }).join("");
}

function displayMembers(users) {
  const el = document.getElementById("members-list");
  if (!el) return;
  if (!users.length) {
    el.innerHTML = richEmpty(
      `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      "No team members yet", "Add members using the button above."
    );
    return;
  }
  el.innerHTML = users.map(u => `
    <div class="member-card">
      <div class="member-avatar" style="background:linear-gradient(135deg,${projectColor(u.id)},${projectColor(u.id+'x')})">${u.name.charAt(0).toUpperCase()}</div>
      <div class="member-info">
        <span class="member-name">${escapeHtml(u.name)}</span>
        <span class="member-email">${escapeHtml(u.email)}</span>
      </div>
      <span class="member-role-badge role-${u.role}">${u.role}</span>
    </div>`).join("");
}

function updateTaskStats(tasks) {
  const now = new Date(); now.setHours(0,0,0,0);
  let inProgress = 0, overdue = 0;
  tasks.forEach(t => {
    if (t.status === "in-progress") inProgress++;
    if (t.due_date && t.status !== "completed" && new Date(t.due_date).setHours(0,0,0,0) < now.getTime()) overdue++;
  });
  animateCounter(document.getElementById("stat-tasks"),      tasks.length);
  animateCounter(document.getElementById("stat-inprogress"), inProgress);
  animateCounter(document.getElementById("stat-overdue"),    overdue);
  document.querySelector(".si-red")?.classList.toggle("stat-has-alert", overdue > 0);
}

// ── Event setup ───────────────────────────────────────────────

function setupEventListeners() {
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("new-project-btn")?.addEventListener("click", openProjectModal);
  document.getElementById("add-member-btn")?.addEventListener("click", openMemberModal);
  document.getElementById("project-form")?.addEventListener("submit",   handleProjectSubmit);
  document.getElementById("task-form")?.addEventListener("submit",      handleTaskSubmit);
  document.getElementById("member-form")?.addEventListener("submit",    handleMemberSubmit);
  document.getElementById("edit-task-form")?.addEventListener("submit", handleEditTaskSubmit);
}

// ── Form handlers ─────────────────────────────────────────────

async function handleProjectSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const name = f.querySelector("#project-name").value.trim();
  const description = f.querySelector("#project-description").value.trim();
  if (!name) { alert("Project name is required"); return; }
  try {
    const res = await authFetch(`${API_BASE_URL}/projects`, "POST", { name, description });
    if (!res.ok) throw new Error();
    closeProjectModal(); f.reset(); loadProjects();
  } catch { alert("Failed to create project"); }
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const body = {
    title:       f.querySelector("#task-title").value.trim(),
    description: f.querySelector("#task-description").value.trim(),
    project_id:  f.querySelector("#task-project-id").value,
    priority:    f.querySelector("#task-priority").value,
    due_date:    f.querySelector("#task-due-date").value || null,
    assigned_to: f.querySelector("#task-assign").value || null
  };
  if (!body.title || !body.project_id) { alert("Title and project are required"); return; }
  try {
    const res = await authFetch(`${API_BASE_URL}/tasks`, "POST", body);
    if (!res.ok) throw new Error();
    closeTaskModal(); f.reset(); loadTasks();
  } catch { alert("Failed to create task"); }
}

async function handleEditTaskSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-task-id").value;
  const body = {
    title:       document.getElementById("edit-task-title").value.trim(),
    description: document.getElementById("edit-task-description").value.trim(),
    priority:    document.getElementById("edit-task-priority").value,
    due_date:    document.getElementById("edit-task-due-date").value || null,
    status:      document.getElementById("edit-task-status").value,
    assigned_to: document.getElementById("edit-task-assign").value || null
  };
  try {
    const res = await authFetch(`${API_BASE_URL}/tasks/${id}`, "PUT", body);
    if (!res.ok) throw new Error();
    closeEditTaskModal(); loadTasks();
  } catch { alert("Failed to save changes"); }
}

async function handleMemberSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const name     = f.querySelector("#member-name").value.trim();
  const email    = f.querySelector("#member-email").value.trim();
  const password = f.querySelector("#member-password").value.trim();
  if (!name || !email || !password) { alert("All fields are required"); return; }
  if (password.length < 6) { alert("Password must be at least 6 characters"); return; }
  try {
    const res = await authFetch(`${API_BASE_URL}/auth/register`, "POST", { name, email, password });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed");
    closeMemberModal(); f.reset();
    await loadUsers();
    displayMembers(allUsers);
    alert(`Account created for ${email}`);
  } catch (err) { alert(err.message || "Failed to create account"); }
}

// ── Actions ───────────────────────────────────────────────────

async function changeProjectStatus(projectId, status) {
  try {
    const res = await authFetch(`${API_BASE_URL}/projects/${projectId}`, "PUT", { status });
    if (!res.ok) throw new Error();
    // Update local cache and re-render status dot without full reload
    if (projectsById[projectId]) projectsById[projectId].status = status;
    const card = document.querySelector(`[data-project-id="${projectId}"]`) ||
                 document.querySelector(`.project-card:has([onchange*="${projectId}"])`);
    const dot = document.querySelector(`.project-card [onchange*="'${projectId}'"]`)
                  ?.closest(".project-card")?.querySelector(".project-status-dot");
    if (dot) {
      dot.className = `project-status-dot status-dot-${status}`;
    }
  } catch { alert("Failed to update project status"); loadProjects(); }
}

async function deleteProject(projectId) {
  if (!confirm("Delete this project and all its tasks?")) return;
  try {
    const res = await authFetch(`${API_BASE_URL}/projects/${projectId}`, "DELETE");
    if (!res.ok) throw new Error();
    loadProjects(); loadTasks();
  } catch { alert("Failed to delete project"); }
}

async function updateTaskStatus(taskId, status) {
  try {
    const res = await authFetch(`${API_BASE_URL}/tasks/${taskId}`, "PUT", { status });
    if (!res.ok) throw new Error();
    loadTasks();
  } catch { alert("Failed to update task status"); }
}

// ── Modal helpers ─────────────────────────────────────────────

function openProjectModal() { show("project-modal"); }
function closeProjectModal() { hide("project-modal"); }

function openTaskModal(projectId) {
  document.getElementById("task-project-id").value = projectId;
  populateAssignSelect("task-assign");
  show("task-modal");
}
function closeTaskModal() { hide("task-modal"); }

function openEditTaskModal(taskId) {
  const task = allTasksCache.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById("edit-task-id").value          = taskId;
  document.getElementById("edit-task-title").value       = task.title;
  document.getElementById("edit-task-description").value = task.description || "";
  document.getElementById("edit-task-priority").value    = task.priority;
  document.getElementById("edit-task-due-date").value    = task.due_date ? task.due_date.substring(0, 10) : "";
  document.getElementById("edit-task-status").value      = task.status;
  populateAssignSelect("edit-task-assign", task.assigned_to);
  show("edit-task-modal");
}
function closeEditTaskModal() { hide("edit-task-modal"); }

function openMemberModal()  { show("member-modal"); }
function closeMemberModal() { hide("member-modal"); }

function populateAssignSelect(selectId, selectedId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">— Unassigned —</option>';
  allUsers.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.role})`;
    if (u.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ── Section switching ─────────────────────────────────────────

const SECTION_TITLES = { overview:"Overview", projects:"Projects", tasks:"Tasks", members:"Team" };

function showSection(sectionId, navEl) {
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  (navEl || document.querySelector(`a[href='#${sectionId}']`))?.classList.add("active");

  ["overview","projects","tasks","members"].forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    if (id === "members" && currentUser?.role !== "manager") return;
    if (id === sectionId) {
      sec.style.display = "block";
      sec.classList.remove("section-fade"); void sec.offsetWidth; sec.classList.add("section-fade");
    } else {
      sec.style.display = "none";
    }
  });

  const isManager = currentUser?.role === "manager";
  let title = SECTION_TITLES[sectionId] || "Dashboard";
  if (sectionId === "tasks") title = isManager ? "All Project Tasks" : "My Tasks";
  setText("page-title", title);

  document.querySelector(".main-content")?.scrollTo(0, 0);
}

function scrollToSection(sectionId, navEl) { showSection(sectionId, navEl); }

// ── Utilities ─────────────────────────────────────────────────

function logout() { localStorage.removeItem("token"); window.location.href = "../index.html"; }

function authFetch(url, method = "GET", body) {
  const token = localStorage.getItem("token");
  const opts = { method, headers: { "Authorization": `Bearer ${token}` } };
  if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  return fetch(url, opts);
}

function animateCounter(el, target, ms = 700) {
  if (!el) return;
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / ms, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

const PALETTE = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316"];
function projectColor(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function richEmpty(pathD, title, hint) {
  return `<div class="empty-state-rich">
    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">${pathD}</svg></div>
    <p class="empty-title">${title}</p>
    <p class="empty-hint">${hint}</p>
  </div>`;
}

function showRetryError(listId, retryFn, msg = "Couldn't load data. Click to retry.") {
  const el = document.getElementById(listId);
  if (!el) return;
  el.innerHTML = `<div class="error-state-rich">
    <p>${msg}</p>
    <button class="btn btn-small btn-ghost retry-btn" onclick="(${retryFn.name})()">Retry</button>
  </div>`;
}

function escapeHtml(text) { const d = document.createElement("div"); d.textContent = text; return d.innerHTML; }
function formatDate(s) { return new Date(s).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }); }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function setText(idOrEl, val) {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (el) el.textContent = val;
}
function show(id) { const el = document.getElementById(id); if (el) el.style.display = "flex"; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// Expose globals called from inline HTML
window.closeProjectModal  = closeProjectModal;
window.closeTaskModal     = closeTaskModal;
window.closeEditTaskModal = closeEditTaskModal;
window.closeMemberModal   = closeMemberModal;
window.openTaskModal      = openTaskModal;
window.openEditTaskModal  = openEditTaskModal;
window.deleteProject      = deleteProject;
window.updateTaskStatus   = updateTaskStatus;
window.changeProjectStatus = changeProjectStatus;
window.scrollToSection    = scrollToSection;
window.showSection        = showSection;

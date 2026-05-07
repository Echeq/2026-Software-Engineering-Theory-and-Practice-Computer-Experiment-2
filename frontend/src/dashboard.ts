const API_BASE_URL = "http://localhost:3000/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: string;
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

let currentUser: User | null = null;
let allUsers: User[] = [];
let usersById: Record<string, User> = {};
let projectsById: Record<string, Project> = {};

document.addEventListener("DOMContentLoaded", async () => {
  checkAuthentication();
  setupEventListeners();
  await Promise.all([loadUserData(), loadUsers()]);
  showSection("overview");
  loadProjects();
  loadTasks();
});

function checkAuthentication(): void {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
  }
}

async function loadUserData(): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    if (!response.ok) return;
    const data = await response.json();
    currentUser = data.user;

    const userNameEl = document.getElementById("user-name");
    const userAvatarEl = document.getElementById("user-avatar");
    const userRoleEl = document.getElementById("user-role-label");
    if (userNameEl && currentUser) userNameEl.textContent = currentUser.name;
    if (userAvatarEl && currentUser) userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    if (userRoleEl && currentUser) {
      userRoleEl.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    }

    if (currentUser && currentUser.role === "manager") {
      const addMemberBtn = document.getElementById("add-member-btn");
      if (addMemberBtn) addMemberBtn.style.display = "inline-flex";
      const membersSection = document.getElementById("members");
      if (membersSection) membersSection.style.display = "block";
      const membersNavItem = document.querySelector(".nav-item-members") as HTMLElement | null;
      if (membersNavItem) membersNavItem.style.display = "flex";
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

async function loadUsers(): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) return;
    const data = await response.json();
    allUsers = data.users || [];
    usersById = {};
    allUsers.forEach(u => { usersById[u.id] = u; });
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

async function loadProjects(): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to load projects");
    const data = await response.json();
    projectsById = {};
    (data.projects || []).forEach((p: Project) => { projectsById[p.id] = p; });
    displayProjects(data.projects || []);
    const statEl = document.getElementById("stat-projects");
    if (statEl) statEl.textContent = String((data.projects || []).length);
  } catch (error) {
    console.error("Error loading projects:", error);
    showListError("projects-list");
  }
}

async function loadTasks(): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const isManager = currentUser?.role === "manager";
    const endpoint = isManager ? `${API_BASE_URL}/tasks` : `${API_BASE_URL}/tasks/my-tasks`;
    const response = await fetch(endpoint, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to load tasks");
    const data = await response.json();
    const tasks: Task[] = data.tasks || [];
    displayTasks(tasks, isManager);
    updateTaskStats(tasks);
    if (isManager) {
      displayMembers(allUsers);
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
    showListError("tasks-list");
  }
}

function updateTaskStats(tasks: Task[]): void {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let inProgress = 0;
  let overdue = 0;
  tasks.forEach(task => {
    if (task.status === "in-progress") inProgress++;
    if (task.due_date && task.status !== "completed") {
      const due = new Date(task.due_date);
      due.setHours(0, 0, 0, 0);
      if (due < now) overdue++;
    }
  });
  const statTasks = document.getElementById("stat-tasks");
  const statInProgress = document.getElementById("stat-inprogress");
  const statOverdue = document.getElementById("stat-overdue");
  if (statTasks) statTasks.textContent = String(tasks.length);
  if (statInProgress) statInProgress.textContent = String(inProgress);
  if (statOverdue) statOverdue.textContent = String(overdue);
}

function displayProjects(projects: Project[]): void {
  const projectsList = document.getElementById("projects-list");
  if (!projectsList) return;
  if (projects.length === 0) {
    projectsList.innerHTML = '<p class="empty-state">No projects yet. Create your first project!</p>';
    return;
  }
  projectsList.innerHTML = projects.map(project => `
    <div class="project-card" data-project-id="${project.id}">
      <div class="project-card-header">
        <span class="project-status-dot status-dot-${project.status}"></span>
        <span class="project-status-label">${project.status}</span>
      </div>
      <h3 class="project-name">${escapeHtml(project.name)}</h3>
      ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : '<p class="project-description empty-desc">No description</p>'}
      <div class="project-footer">
        <button class="btn btn-small btn-outline" onclick="openTaskModal('${project.id}')">+ Add Task</button>
        <button class="btn btn-small btn-danger-ghost" onclick="deleteProject('${project.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function displayTasks(tasks: Task[], isManager?: boolean): void {
  const tasksList = document.getElementById("tasks-list");
  if (!tasksList) return;

  const tasksSectionTitle = document.querySelector("#tasks .section-title");
  if (tasksSectionTitle) {
    tasksSectionTitle.textContent = isManager ? "All Project Tasks" : "My Tasks";
  }
  const tasksNavLabel = document.querySelector("a[href='#tasks'] .nav-label");
  if (tasksNavLabel) tasksNavLabel.textContent = isManager ? "All Tasks" : "My Tasks";

  if (tasks.length === 0) {
    const msg = isManager
      ? "No tasks in your projects yet. Add a task to one of your projects."
      : "No tasks assigned to you yet.";
    tasksList.innerHTML = `<p class="empty-state">${msg}</p>`;
    return;
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  tasksList.innerHTML = tasks.map(task => {
    const isOverdue = task.due_date && task.status !== "completed" && new Date(task.due_date).setHours(0,0,0,0) < now.getTime();
    const projectName = projectsById[task.project_id] ? escapeHtml(projectsById[task.project_id].name) : "Unknown Project";
    const assignedUser = task.assigned_to && usersById[task.assigned_to] ? usersById[task.assigned_to].name : null;
    return `
    <div class="task-item${isOverdue ? " overdue" : ""}" data-task-id="${task.id}">
      <div class="task-info">
        <div class="task-chips">
          <span class="task-project-chip">${projectName}</span>
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
          ${assignedUser ? `<span class="task-assignee-chip">${escapeHtml(assignedUser)}</span>` : ""}
        </div>
        <h4 class="task-title">${escapeHtml(task.title)}</h4>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
        ${task.due_date ? `<span class="due-date${isOverdue ? " is-overdue" : ""}">Due ${formatDate(task.due_date)}</span>` : ""}
      </div>
      <div class="task-actions">
        <select onchange="updateTaskStatus('${task.id}', this.value)" class="status-select">
          <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
          <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
        </select>
      </div>
    </div>`;
  }).join("");
}

function displayMembers(users: User[]): void {
  const membersList = document.getElementById("members-list");
  if (!membersList) return;
  if (users.length === 0) {
    membersList.innerHTML = '<p class="empty-state">No team members yet.</p>';
    return;
  }
  membersList.innerHTML = users.map(user => `
    <div class="member-card">
      <div class="member-avatar">${user.name.charAt(0).toUpperCase()}</div>
      <div class="member-info">
        <span class="member-name">${escapeHtml(user.name)}</span>
        <span class="member-email">${escapeHtml(user.email)}</span>
      </div>
      <span class="member-role-badge role-${user.role}">${user.role}</span>
    </div>
  `).join("");
}

function setupEventListeners(): void {
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("new-project-btn")?.addEventListener("click", openProjectModal);
  document.getElementById("add-member-btn")?.addEventListener("click", openMemberModal);
  (document.getElementById("project-form") as HTMLFormElement)?.addEventListener("submit", handleProjectSubmit);
  (document.getElementById("task-form") as HTMLFormElement)?.addEventListener("submit", handleTaskSubmit);
  (document.getElementById("member-form") as HTMLFormElement)?.addEventListener("submit", handleMemberSubmit);
}

async function handleProjectSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const name = (form.querySelector("#project-name") as HTMLInputElement).value.trim();
  const description = (form.querySelector("#project-description") as HTMLTextAreaElement).value.trim();
  if (!name) { alert("Project name is required"); return; }
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name, description })
    });
    if (!response.ok) throw new Error("Failed to create project");
    closeProjectModal();
    form.reset();
    loadProjects();
  } catch (error) {
    console.error("Error creating project:", error);
    alert("Failed to create project");
  }
}

async function handleTaskSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const projectId = (form.querySelector("#task-project-id") as HTMLInputElement).value;
  const title = (form.querySelector("#task-title") as HTMLInputElement).value.trim();
  const description = (form.querySelector("#task-description") as HTMLTextAreaElement).value.trim();
  const priority = (form.querySelector("#task-priority") as HTMLSelectElement).value;
  const dueDate = (form.querySelector("#task-due-date") as HTMLInputElement).value;
  const assignedTo = (form.querySelector("#task-assign") as HTMLSelectElement).value;
  if (!title || !projectId) { alert("Task title and project are required"); return; }
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        title, description, project_id: projectId, priority,
        due_date: dueDate || null,
        assigned_to: assignedTo || null
      })
    });
    if (!response.ok) throw new Error("Failed to create task");
    closeTaskModal();
    form.reset();
    loadTasks();
  } catch (error) {
    console.error("Error creating task:", error);
    alert("Failed to create task");
  }
}

async function handleMemberSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const name = (form.querySelector("#member-name") as HTMLInputElement).value.trim();
  const email = (form.querySelector("#member-email") as HTMLInputElement).value.trim();
  const password = (form.querySelector("#member-password") as HTMLInputElement).value.trim();
  if (!name || !email || !password) { alert("All fields are required"); return; }
  if (password.length < 6) { alert("Password must be at least 6 characters"); return; }
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to create member account");
    closeMemberModal();
    form.reset();
    await loadUsers();
    displayMembers(allUsers);
    alert(`Account created for ${email}`);
  } catch (error: any) {
    console.error("Error creating member:", error);
    alert(error.message || "Failed to create member account");
  }
}

async function deleteProject(projectId: string): Promise<void> {
  if (!confirm("Delete this project and all its tasks?")) return;
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to delete project");
    loadProjects();
    loadTasks();
  } catch (error) {
    console.error("Error deleting project:", error);
    alert("Failed to delete project");
  }
}

async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error("Failed to update task");
    loadTasks();
  } catch (error) {
    console.error("Error updating task:", error);
    alert("Failed to update task status");
  }
}

function openProjectModal(): void {
  (document.getElementById("project-modal") as HTMLElement).style.display = "flex";
}

function closeProjectModal(): void {
  (document.getElementById("project-modal") as HTMLElement).style.display = "none";
}

function openTaskModal(projectId: string): void {
  const modal = document.getElementById("task-modal") as HTMLElement;
  const projectIdInput = document.getElementById("task-project-id") as HTMLInputElement;
  const assignSelect = document.getElementById("task-assign") as HTMLSelectElement;
  if (!modal || !projectIdInput) return;
  projectIdInput.value = projectId;
  if (assignSelect) {
    assignSelect.innerHTML = '<option value="">— Unassigned —</option>';
    allUsers.forEach(user => {
      const opt = document.createElement("option");
      opt.value = user.id;
      opt.textContent = `${user.name} (${user.role})`;
      assignSelect.appendChild(opt);
    });
  }
  modal.style.display = "flex";
}

function closeTaskModal(): void {
  (document.getElementById("task-modal") as HTMLElement).style.display = "none";
}

function openMemberModal(): void {
  (document.getElementById("member-modal") as HTMLElement).style.display = "flex";
}

function closeMemberModal(): void {
  (document.getElementById("member-modal") as HTMLElement).style.display = "none";
}

const SECTION_TITLES: Record<string, string> = {
  overview: "Overview",
  projects: "Projects",
  tasks: "Tasks",
  members: "Team"
};

function showSection(sectionId: string, navEl?: HTMLElement | null): void {
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  if (navEl) {
    navEl.classList.add("active");
  } else {
    const autoNav = document.querySelector(`a[href='#${sectionId}']`);
    if (autoNav) autoNav.classList.add("active");
  }

  ["overview", "projects", "tasks", "members"].forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    if (id === "members" && currentUser?.role !== "manager") return;
    section.style.display = id === sectionId ? "block" : "none";
  });

  const isManager = currentUser?.role === "manager";
  const pageTitleEl = document.getElementById("page-title");
  if (pageTitleEl) {
    let title = SECTION_TITLES[sectionId] || "Dashboard";
    if (sectionId === "tasks") title = isManager ? "All Project Tasks" : "My Tasks";
    pageTitleEl.textContent = title;
  }

  const mainContent = document.querySelector(".main-content");
  if (mainContent) mainContent.scrollTop = 0;
}

function scrollToSection(sectionId: string, navEl: HTMLElement | null): void {
  showSection(sectionId, navEl);
}

function logout(): void {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
}

function showListError(listId: string): void {
  const el = document.getElementById(listId);
  if (el) el.innerHTML = '<p class="error-state">Failed to load. Please refresh.</p>';
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

(window as any).closeProjectModal = closeProjectModal;
(window as any).closeTaskModal = closeTaskModal;
(window as any).closeMemberModal = closeMemberModal;
(window as any).openTaskModal = openTaskModal;
(window as any).deleteProject = deleteProject;
(window as any).updateTaskStatus = updateTaskStatus;
(window as any).scrollToSection = scrollToSection;
(window as any).showSection = showSection;

export {};

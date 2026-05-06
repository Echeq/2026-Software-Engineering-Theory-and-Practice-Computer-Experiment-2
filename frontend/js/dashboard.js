"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_BASE_URL = "http://localhost:8080/api";
let currentUser = null;
// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    loadUserData();
    loadProjects();
    loadTasks();
    setupEventListeners();
});
function checkAuthentication() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }
}
async function loadUserData() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to load user data");
        }
        const data = await response.json();
        currentUser = data.user;
        const userNameElement = document.getElementById("user-name");
        if (userNameElement && currentUser) {
            userNameElement.textContent = currentUser.name;
        }
    }
    catch (error) {
        console.error("Error loading user data:", error);
        logout();
    }
}
async function loadProjects() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/projects`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to load projects");
        }
        const data = await response.json();
        displayProjects(data.projects);
    }
    catch (error) {
        console.error("Error loading projects:", error);
        showProjectsListError();
    }
}
async function loadTasks() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/tasks/my-tasks`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }
        const data = await response.json();
        displayTasks(data.tasks);
    }
    catch (error) {
        console.error("Error loading tasks:", error);
        showTasksListError();
    }
}
function displayProjects(projects) {
    const projectsList = document.getElementById("projects-list");
    if (!projectsList)
        return;
    if (projects.length === 0) {
        projectsList.innerHTML = '<p class="empty-state">No projects yet. Create your first project!</p>';
        return;
    }
    projectsList.innerHTML = projects.map(project => `
    <div class="project-card" data-project-id="${project.id}">
      <div class="project-header">
        <h3 class="project-name">${escapeHtml(project.name)}</h3>
        <span class="project-status status-${project.status}">${project.status}</span>
      </div>
      ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
      <div class="project-actions">
        <button class="btn btn-small" onclick="openTaskModal('${project.id}')">+ Add Task</button>
        <button class="btn btn-small btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}
function displayTasks(tasks) {
    const tasksList = document.getElementById("tasks-list");
    if (!tasksList)
        return;
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-state">No tasks assigned to you.</p>';
        return;
    }
    tasksList.innerHTML = tasks.map(task => `
    <div class="task-item" data-task-id="${task.id}">
      <div class="task-info">
        <h4 class="task-title">${escapeHtml(task.title)}</h4>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
          ${task.due_date ? `<span class="due-date">Due: ${formatDate(task.due_date)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <select onchange="updateTaskStatus('${task.id}', this.value)" class="status-select">
          <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
    </div>
  `).join('');
}
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
    // New project button
    const newProjectBtn = document.getElementById("new-project-btn");
    if (newProjectBtn) {
        newProjectBtn.addEventListener("click", openProjectModal);
    }
    // Project form submission
    const projectForm = document.getElementById("project-form");
    if (projectForm) {
        projectForm.addEventListener("submit", handleProjectSubmit);
    }
    // Task form submission
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", handleTaskSubmit);
    }
}
async function handleProjectSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector("#project-name").value.trim();
    const description = form.querySelector("#project-description").value.trim();
    if (!name) {
        alert("Project name is required");
        return;
    }
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });
        if (!response.ok) {
            throw new Error("Failed to create project");
        }
        closeProjectModal();
        form.reset();
        loadProjects();
    }
    catch (error) {
        console.error("Error creating project:", error);
        alert("Failed to create project");
    }
}
async function handleTaskSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const projectId = form.querySelector("#task-project-id").value;
    const title = form.querySelector("#task-title").value.trim();
    const description = form.querySelector("#task-description").value.trim();
    const priority = form.querySelector("#task-priority").value;
    const dueDate = form.querySelector("#task-due-date").value;
    if (!title || !projectId) {
        alert("Task title and project are required");
        return;
    }
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                project_id: projectId,
                priority,
                due_date: dueDate || null
            })
        });
        if (!response.ok) {
            throw new Error("Failed to create task");
        }
        closeTaskModal();
        form.reset();
        loadTasks();
    }
    catch (error) {
        console.error("Error creating task:", error);
        alert("Failed to create task");
    }
}
async function deleteProject(projectId) {
    if (!confirm("Are you sure you want to delete this project? This will also delete all its tasks.")) {
        return;
    }
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error("Failed to delete project");
        }
        loadProjects();
        loadTasks();
    }
    catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project");
    }
}
async function updateTaskStatus(taskId, status) {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            throw new Error("Failed to update task");
        }
    }
    catch (error) {
        console.error("Error updating task:", error);
        alert("Failed to update task status");
    }
}
function openProjectModal() {
    const modal = document.getElementById("project-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}
function closeProjectModal() {
    const modal = document.getElementById("project-modal");
    if (modal) {
        modal.style.display = "none";
    }
}
function openTaskModal(projectId) {
    const modal = document.getElementById("task-modal");
    const projectIdInput = document.getElementById("task-project-id");
    if (modal && projectIdInput) {
        projectIdInput.value = projectId;
        modal.style.display = "flex";
    }
}
function closeTaskModal() {
    const modal = document.getElementById("task-modal");
    if (modal) {
        modal.style.display = "none";
    }
}
function logout() {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
}
function showProjectsListError() {
    const projectsList = document.getElementById("projects-list");
    if (projectsList) {
        projectsList.innerHTML = '<p class="error-state">Failed to load projects. Please refresh the page.</p>';
    }
}
function showTasksListError() {
    const tasksList = document.getElementById("tasks-list");
    if (tasksList) {
        tasksList.innerHTML = '<p class="error-state">Failed to load tasks. Please refresh the page.</p>';
    }
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
// Make functions available globally for inline event handlers
window.closeProjectModal = closeProjectModal;
window.closeTaskModal = closeTaskModal;
window.openTaskModal = openTaskModal;
window.deleteProject = deleteProject;
window.updateTaskStatus = updateTaskStatus;
//# sourceMappingURL=dashboard.js.map
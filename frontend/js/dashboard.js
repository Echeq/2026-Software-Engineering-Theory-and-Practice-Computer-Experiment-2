"use strict";
/* Original pre-sidebar layout backed up in ./dashboard.layout-backup.ts */
const API_BASE_URL = `${window.location.origin}/api`;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
let isPreviewMode = false;
const PREVIEW_PROJECTS = [
    {
        id: "preview-1",
        name: "Semester Project Planner",
        description: "Track milestones, assignments, and deadlines for the current term.",
        owner_id: "preview-user",
        status: "active",
        created_at: new Date("2026-03-12").toISOString()
    },
    {
        id: "preview-2",
        name: "UX Research Board",
        description: "Collect interview notes, usability feedback, and iteration ideas.",
        owner_id: "preview-user",
        status: "in-review",
        created_at: new Date("2026-04-02").toISOString()
    },
    {
        id: "preview-3",
        name: "Frontend Showcase",
        description: "A visual preview project to review the dashboard style without backend data.",
        owner_id: "preview-user",
        status: "planning",
        created_at: new Date("2026-04-18").toISOString()
    }
];
let currentUser = null;
let userNameElement = null;
let projectsMessageBox = null;
let projectsListElement = null;
let newProjectButton = null;
let logoutButton = null;
let themeToggleButton = null;
let sidebarToggleButton = null;
let sidebarElement = null;
let sidebarBackdropElement = null;
let projectModalElement = null;
let projectFormElement = null;
let projectNameInput = null;
let projectDescriptionInput = null;
let projectFormMessageBox = null;
let projectSubmitButton = null;
let closeProjectModalButton = null;
let cancelProjectModalButton = null;
document.addEventListener("DOMContentLoaded", () => {
    void initializeDashboard();
});
async function initializeDashboard() {
    cacheElements();
    initializeTheme();
    syncSidebarState();
    setupEventListeners();
    const token = getStoredToken();
    if (!token) {
        loadPreviewDashboard();
        return;
    }
    renderProjectsLoading();
    await loadUserData();
    await loadProjects();
}
function cacheElements() {
    userNameElement = document.getElementById("user-name");
    projectsMessageBox = document.getElementById("projects-message");
    projectsListElement = document.getElementById("projects-list");
    newProjectButton = document.getElementById("new-project-btn");
    logoutButton = document.getElementById("logout-btn");
    themeToggleButton = document.getElementById("theme-toggle-btn");
    sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
    sidebarElement = document.getElementById("dashboard-sidebar");
    sidebarBackdropElement = document.getElementById("sidebar-backdrop");
    projectModalElement = document.getElementById("project-modal");
    projectFormElement = document.getElementById("project-form");
    projectNameInput = document.getElementById("project-name");
    projectDescriptionInput = document.getElementById("project-description");
    projectFormMessageBox = document.getElementById("project-form-message");
    projectSubmitButton = document.getElementById("project-submit-btn");
    closeProjectModalButton = document.getElementById("close-project-modal");
    cancelProjectModalButton = document.getElementById("cancel-project-btn");
}
function setupEventListeners() {
    logoutButton?.addEventListener("click", logout);
    themeToggleButton?.addEventListener("click", toggleTheme);
    sidebarToggleButton?.addEventListener("click", toggleSidebar);
    sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
    newProjectButton?.addEventListener("click", openProjectModal);
    closeProjectModalButton?.addEventListener("click", closeProjectModal);
    cancelProjectModalButton?.addEventListener("click", closeProjectModal);
    projectFormElement?.addEventListener("submit", handleProjectSubmit);
    projectModalElement?.addEventListener("click", handleProjectModalClick);
    window.addEventListener("resize", syncSidebarState);
    document.addEventListener("keydown", handleEscapeKey);
    document.querySelectorAll(".sidebar-link").forEach((link) => {
        link.addEventListener("click", () => {
            if (isMobileViewport()) {
                closeSidebar();
            }
        });
    });
}
function initializeTheme() {
    const storedTheme = readStoredTheme();
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(storedTheme || preferredTheme);
}
function readStoredTheme() {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") {
        return value;
    }
    return "";
}
function toggleTheme() {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}
function applyTheme(theme) {
    document.body.dataset.theme = theme;
    if (!themeToggleButton) {
        return;
    }
    const isDarkTheme = theme === "dark";
    themeToggleButton.textContent = isDarkTheme ? "Light Mode" : "Dark Mode";
    themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
    themeToggleButton.setAttribute("aria-label", isDarkTheme ? "Switch to light mode" : "Switch to dark mode");
}
function isMobileViewport() {
    return window.innerWidth <= MOBILE_SIDEBAR_BREAKPOINT;
}
function syncSidebarState() {
    if (!sidebarElement || !sidebarToggleButton || !sidebarBackdropElement) {
        return;
    }
    if (!isMobileViewport()) {
        document.body.classList.remove("sidebar-open");
    }
    const isSidebarOpen = !isMobileViewport() || document.body.classList.contains("sidebar-open");
    sidebarElement.setAttribute("aria-hidden", String(!isSidebarOpen));
    sidebarToggleButton.setAttribute("aria-expanded", String(isMobileViewport() && document.body.classList.contains("sidebar-open")));
    sidebarToggleButton.setAttribute("aria-label", document.body.classList.contains("sidebar-open") ? "Close navigation menu" : "Open navigation menu");
    sidebarBackdropElement.hidden = !(isMobileViewport() && document.body.classList.contains("sidebar-open"));
}
function openSidebar() {
    if (!isMobileViewport()) {
        return;
    }
    document.body.classList.add("sidebar-open");
    syncSidebarState();
}
function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    syncSidebarState();
}
function toggleSidebar() {
    if (document.body.classList.contains("sidebar-open")) {
        closeSidebar();
        return;
    }
    openSidebar();
}
function handleSidebarBackdropClick(event) {
    const target = event.target;
    if (target?.dataset.closeSidebar === "true") {
        closeSidebar();
    }
}
function loadPreviewDashboard() {
    isPreviewMode = true;
    currentUser = {
        id: "preview-user",
        name: "Anna Ivanova",
        email: "anna.ivanova@example.com"
    };
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
    showProjectsMessage("Preview mode: dashboard style is shown with demo data.", "success");
    renderProjects(PREVIEW_PROJECTS);
}
async function loadUserData() {
    try {
        const data = await requestWithAuth("/auth/me");
        currentUser = data.user;
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
    }
    catch (error) {
        console.error("Error loading user data:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        if (userNameElement) {
            userNameElement.textContent = "Unavailable";
        }
    }
}
async function loadProjects(options = {}) {
    if (!options.preserveMessage) {
        showProjectsMessage("");
    }
    renderProjectsLoading();
    try {
        const data = await requestWithAuth("/projects");
        renderProjects(data.projects);
    }
    catch (error) {
        console.error("Error loading projects:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        renderProjectsError(getErrorText(error, "Failed to load projects. Please refresh the page."));
    }
}
function renderProjectsLoading() {
    if (!projectsListElement) {
        return;
    }
    projectsListElement.innerHTML = `
    <article class="state-card">
      <h3>Loading projects...</h3>
      <p>Fetching your workspace.</p>
    </article>
  `;
}
function renderProjects(projects) {
    if (!projectsListElement) {
        return;
    }
    if (projects.length === 0) {
        projectsListElement.innerHTML = `
      <article class="state-card">
        <h3>No projects yet</h3>
        <p>Create your first project to start organizing tasks and deliverables.</p>
      </article>
    `;
        return;
    }
    projectsListElement.innerHTML = projects.map((project) => {
        const creatorName = escapeHtml(currentUser?.name || "You");
        const description = project.description?.trim()
            ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
            : '<p class="project-description is-empty">No description yet.</p>';
        const query = new URLSearchParams({
            projectId: project.id,
            projectName: project.name,
            status: formatStatus(project.status),
            creator: currentUser?.name || "You",
            createdAt: project.created_at
        }).toString();
        return `
      <a class="project-card project-card-link" href="./tasks.html?${query}" data-project-id="${escapeHtml(project.id)}">
        <div class="project-head">
          <h3 class="project-name">${escapeHtml(project.name)}</h3>
          <span class="project-status">${escapeHtml(formatStatus(project.status))}</span>
        </div>
        ${description}
        <div class="project-meta">
          <span class="project-owner">${creatorName}</span>
          <span>${escapeHtml(formatProjectDate(project.created_at))}</span>
        </div>
      </a>
    `;
    }).join("");
}
function renderProjectsError(text) {
    if (!projectsListElement) {
        return;
    }
    projectsListElement.innerHTML = `
    <article class="state-card">
      <h3>Projects unavailable</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}
async function handleProjectSubmit(event) {
    event.preventDefault();
    resetProjectFormErrors();
    if (!projectNameInput || !projectDescriptionInput) {
        return;
    }
    const name = projectNameInput.value.trim();
    const description = projectDescriptionInput.value.trim();
    const isValid = validateProjectForm(name, description);
    if (!isValid) {
        showProjectFormMessage("Fix the form errors and try again.", "error");
        return;
    }
    setProjectSubmitting(true);
    try {
        if (isPreviewMode && currentUser) {
            PREVIEW_PROJECTS.unshift({
                id: `preview-${Date.now()}`,
                name,
                description: description || null,
                owner_id: currentUser.id,
                status: "planning",
                created_at: new Date().toISOString()
            });
            closeProjectModal();
            showProjectsMessage("Preview project created successfully.", "success");
            renderProjects(PREVIEW_PROJECTS);
            return;
        }
        await requestWithAuth("/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                description: description || undefined
            })
        });
        closeProjectModal();
        showProjectsMessage("Project created successfully.", "success");
        await loadProjects({ preserveMessage: true });
    }
    catch (error) {
        console.error("Error creating project:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        showProjectFormMessage(getErrorText(error, "Failed to create project."), "error");
    }
    finally {
        setProjectSubmitting(false);
    }
}
function validateProjectForm(name, description) {
    let isValid = true;
    if (!name) {
        setProjectFieldError("project-name", "Project name is required.");
        isValid = false;
    }
    else if (name.length < 2) {
        setProjectFieldError("project-name", "Project name must be at least 2 characters.");
        isValid = false;
    }
    if (description.length > 500) {
        setProjectFieldError("project-description", "Description must be 500 characters or fewer.");
        isValid = false;
    }
    return isValid;
}
function setProjectFieldError(fieldId, text) {
    const input = document.getElementById(fieldId);
    const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`);
    input?.classList.add("input-error");
    if (errorBox) {
        errorBox.textContent = text;
    }
}
function resetProjectFormErrors() {
    showProjectFormMessage("");
    projectFormElement?.querySelectorAll(".field-error").forEach((element) => {
        element.textContent = "";
    });
    projectFormElement?.querySelectorAll(".input-error").forEach((element) => {
        element.classList.remove("input-error");
    });
}
function showProjectsMessage(text, type) {
    if (!projectsMessageBox) {
        return;
    }
    projectsMessageBox.textContent = text;
    projectsMessageBox.className = type ? `form-message ${type}` : "form-message";
}
function showProjectFormMessage(text, type) {
    if (!projectFormMessageBox) {
        return;
    }
    projectFormMessageBox.textContent = text;
    projectFormMessageBox.className = type ? `form-message ${type}` : "form-message";
}
function setProjectSubmitting(isSubmitting) {
    if (!projectSubmitButton) {
        return;
    }
    projectSubmitButton.disabled = isSubmitting;
    projectSubmitButton.textContent = isSubmitting ? "Creating..." : "Create Project";
}
function openProjectModal() {
    if (!projectModalElement) {
        return;
    }
    closeSidebar();
    projectModalElement.hidden = false;
    projectModalElement.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    projectNameInput?.focus();
}
function closeProjectModal() {
    if (!projectModalElement) {
        return;
    }
    projectModalElement.hidden = true;
    projectModalElement.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    projectFormElement?.reset();
    resetProjectFormErrors();
    setProjectSubmitting(false);
}
function handleProjectModalClick(event) {
    const target = event.target;
    if (target?.dataset.closeModal === "true") {
        closeProjectModal();
    }
}
function handleEscapeKey(event) {
    if (event.key !== "Escape") {
        return;
    }
    if (projectModalElement && !projectModalElement.hidden) {
        closeProjectModal();
        return;
    }
    if (document.body.classList.contains("sidebar-open")) {
        closeSidebar();
    }
}
function getStoredToken() {
    return localStorage.getItem("token")?.trim() || "";
}
function redirectToLogin() {
    window.location.href = "../index.html";
}
function logout() {
    closeSidebar();
    localStorage.removeItem("token");
    redirectToLogin();
}
async function requestWithAuth(path, init = {}) {
    const token = getStoredToken();
    const headers = new Headers(init.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    if (!response.ok) {
        throw new Error(readMessage(data, "Request failed."));
    }
    return data;
}
function readMessage(data, fallback) {
    if (typeof data === "object" && data !== null && "message" in data) {
        const message = data.message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }
    return fallback;
}
function getErrorText(error, fallback) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    return fallback;
}
function formatStatus(status) {
    return status
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function formatProjectDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return "Created recently";
    }
    return `Created ${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    })}`;
}
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
//# sourceMappingURL=dashboard.js.map
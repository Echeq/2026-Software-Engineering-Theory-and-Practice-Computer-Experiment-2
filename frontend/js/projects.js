"use strict";
var ProjectsPage;
(function (ProjectsPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    const KANBAN_COLUMNS = [
        {
            id: "start-next",
            title: "Start Next",
            caption: "Queued, planning, and next-up work."
        },
        {
            id: "in-progress",
            title: "In Progress",
            caption: "Active delivery and review right now."
        },
        {
            id: "done",
            title: "Done",
            caption: "Completed work ready for reference."
        }
    ];
    const PREVIEW_PROJECTS = [
        {
            id: "preview-start-next",
            name: "Semester Project Planner",
            description: "Plan milestones, deadlines, and release order before implementation begins.",
            owner_id: "preview-user",
            status: "planning",
            created_at: new Date("2026-03-12").toISOString()
        },
        {
            id: "preview-in-progress",
            name: "Research Collaboration Hub",
            description: "Coordinate active project updates, meeting notes, and shared feedback across the team.",
            owner_id: "preview-user",
            status: "active",
            created_at: new Date("2026-04-02").toISOString()
        },
        {
            id: "preview-done",
            name: "Frontend Showcase",
            description: "Completed presentation-ready project used to review the latest interface iteration.",
            owner_id: "preview-user",
            status: "done",
            created_at: new Date("2026-04-18").toISOString()
        }
    ];
    let currentUser = null;
    let isPreviewMode = false;
    let userNameElement = null;
    let projectsMessageBox = null;
    let projectsBoardElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    document.addEventListener("DOMContentLoaded", () => {
        void initializeProjectsPage();
    });
    async function initializeProjectsPage() {
        cacheElements();
        initializeTheme();
        syncSidebarState();
        setupEventListeners();
        const token = getStoredToken();
        if (!token) {
            loadPreviewProjectsBoard();
            return;
        }
        renderBoardLoading();
        await loadUserData();
        await loadProjects();
    }
    function cacheElements() {
        userNameElement = document.getElementById("user-name");
        projectsMessageBox = document.getElementById("projects-message");
        projectsBoardElement = document.getElementById("projects-board");
        logoutButton = document.getElementById("logout-btn");
        themeToggleButton = document.getElementById("theme-toggle-btn");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
    }
    function setupEventListeners() {
        logoutButton?.addEventListener("click", logout);
        themeToggleButton?.addEventListener("click", toggleTheme);
        sidebarToggleButton?.addEventListener("click", toggleSidebar);
        sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
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
        return value === "light" || value === "dark" ? value : "";
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
        themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
        themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
        themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
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
    function handleEscapeKey(event) {
        if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
            closeSidebar();
        }
    }
    function loadPreviewProjectsBoard() {
        isPreviewMode = true;
        currentUser = {
            id: "preview-user",
            name: "Anna Ivanova",
            email: "anna.ivanova@example.com"
        };
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        showProjectsMessage(i18n("projects.preview"), "success");
        renderProjectsBoard(PREVIEW_PROJECTS);
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
    async function loadProjects() {
        showProjectsMessage("");
        renderBoardLoading();
        try {
            const data = await requestWithAuth("/projects");
            renderProjectsBoard(data.projects);
        }
        catch (error) {
            console.error("Error loading projects:", error);
            if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
                return;
            }
            renderBoardError(getErrorText(error, "Failed to load projects. Please refresh the page."));
        }
    }
    function renderBoardLoading() {
        if (!projectsBoardElement) {
            return;
        }
        projectsBoardElement.innerHTML = `
      <article class="state-card">
        <h3>${escapeHtml(i18n("dashboard.loadingTitle"))}</h3>
        <p>${escapeHtml(i18n("projects.loadingText"))}</p>
      </article>
    `;
    }
    function renderProjectsBoard(projects) {
        if (!projectsBoardElement) {
            return;
        }
        const groupedProjects = groupProjectsByColumn(projects);
        projectsBoardElement.innerHTML = KANBAN_COLUMNS.map((column) => renderColumn(column, groupedProjects[column.id])).join("");
    }
    function groupProjectsByColumn(projects) {
        const grouped = {
            "start-next": [],
            "in-progress": [],
            done: []
        };
        projects.forEach((project) => {
            grouped[getColumnId(project.status)].push(project);
        });
        return grouped;
    }
    function getColumnId(status) {
        const normalizedStatus = status.trim().toLowerCase();
        if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(normalizedStatus)) {
            return "done";
        }
        if (["active", "in-progress", "in review", "in-review", "review", "blocked"].includes(normalizedStatus)) {
            return "in-progress";
        }
        return "start-next";
    }
    function renderColumn(column, projects) {
        const cardsMarkup = projects.length > 0
            ? projects.map((project) => renderProjectCard(project)).join("")
            : `
          <article class="state-card empty-column-card">
            <h3>${escapeHtml(i18n("projects.emptyColumn"))}</h3>
            <p>${escapeHtml(i18n("projects.emptyColumnText"))}</p>
          </article>
        `;
        return `
      <section class="kanban-column" aria-labelledby="column-${column.id}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="column-${column.id}" class="kanban-column-title">${escapeHtml(getColumnTitle(column.id))}</h3>
            <p class="kanban-column-caption">${escapeHtml(getColumnCaption(column.id))}</p>
          </div>
          <span class="kanban-count" aria-label="${projects.length} projects">${projects.length}</span>
        </header>
        <div class="kanban-list">
          ${cardsMarkup}
        </div>
      </section>
    `;
    }
    function renderProjectCard(project) {
        const creatorName = escapeHtml(currentUser?.name || i18n("common.you"));
        const description = project.description?.trim()
            ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
            : '<p class="project-description is-empty">No description yet.</p>';
        const normalizedStatus = project.status.trim().toLowerCase();
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
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <span class="project-task-count">${escapeHtml(i18n("common.tasksCount", { count: typeof project.taskCount === "number" ? project.taskCount : 0 }))}</span>
          </div>
          <span class="project-status">${getStatusIconMarkup(normalizedStatus)}${escapeHtml(formatStatus(project.status))}</span>
        </div>
        ${description}
        <div class="project-meta">
          <div class="project-meta-stack">
            <span class="project-owner">${creatorName}</span>
            <span class="project-date">${escapeHtml(formatProjectDate(project.created_at))}</span>
          </div>
        </div>
      </a>
    `;
    }
    function renderBoardError(text) {
        if (!projectsBoardElement) {
            return;
        }
        projectsBoardElement.innerHTML = `
      <article class="state-card">
        <h3>${escapeHtml(i18n("dashboard.projectsUnavailable"))}</h3>
        <p>${escapeHtml(text)}</p>
      </article>
    `;
    }
    function showProjectsMessage(text, type) {
        if (!projectsMessageBox) {
            return;
        }
        projectsMessageBox.textContent = text;
        projectsMessageBox.className = type ? `form-message ${type}` : "form-message";
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
        void fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "same-origin"
        });
        redirectToLogin();
    }
    function getStatusIconMarkup(status) {
        if (status === "active") {
            return '<span class="status-indicator" aria-hidden="true"></span><svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 8h2l1.25-3 2 6 1.5-4h3.75" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        if (status === "planning" || status === "planned" || status === "start-next" || status === "queued") {
            return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 5.25V8l1.75 1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(status)) {
            return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 8.1 7.2 9.8l3.3-3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        return "";
    }
    async function requestWithAuth(path, init = {}) {
        const token = getStoredToken();
        const headers = new Headers(init.headers);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers,
            credentials: "same-origin"
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
            return i18n("common.createdRecently");
        }
        const locale = window.I18n?.getLanguage() === "zh" ? "zh-CN" : window.I18n?.getLanguage() === "es" ? "es-ES" : "en-US";
        return i18n("common.createdDate", { date: date.toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric"
            }) });
    }
    function getColumnTitle(columnId) {
        if (columnId === "start-next") {
            return i18n("projects.startNext");
        }
        if (columnId === "in-progress") {
            return i18n("projects.inProgress");
        }
        return i18n("projects.done");
    }
    function getColumnCaption(columnId) {
        if (columnId === "start-next") {
            return i18n("projects.startNextCaption");
        }
        if (columnId === "in-progress") {
            return i18n("projects.inProgressCaption");
        }
        return i18n("projects.doneCaption");
    }
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
})(ProjectsPage || (ProjectsPage = {}));
//# sourceMappingURL=projects.js.map
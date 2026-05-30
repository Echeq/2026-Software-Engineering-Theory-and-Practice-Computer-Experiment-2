"use strict";
var ProjectsPage;
(function (ProjectsPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const DEFAULT_PROJECT_VIEW_STORAGE_KEY = "defaultProjectView";
    const SELECTED_PROJECT_STORAGE_KEY = "selectedProjectContext";
    const KNOWN_PROJECTS_STORAGE_KEY = "knownProjectsList";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const DB_NAME = "SPMP_DB";
    const DB_VERSION = 1;
    const TASKS_STORE_NAME = "tasks";
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    const setDynamicText = (element, key, values) => {
        if (!element) {
            return;
        }
        if (typeof window.I18n?.setDynamicTranslation === "function") {
            window.I18n.setDynamicTranslation(element, key, values);
            return;
        }
        element.textContent = i18n(key, values);
    };
    const clearDynamicText = (element) => {
        if (!element) {
            return;
        }
        window.I18n?.clearDynamicTranslation?.(element);
    };
    const PREVIEW_PROJECT_BLUEPRINTS = [
        {
            id: "preview-start-next",
            nameKey: "projects.previewProject1Name",
            descriptionKey: "projects.previewProject1Description",
            owner_id: "preview-user",
            status: "planning",
            created_at: new Date("2026-03-12").toISOString()
        },
        {
            id: "preview-in-progress",
            nameKey: "projects.previewProject2Name",
            descriptionKey: "projects.previewProject2Description",
            owner_id: "preview-user",
            status: "active",
            created_at: new Date("2026-04-02").toISOString()
        },
        {
            id: "preview-done",
            nameKey: "projects.previewProject3Name",
            descriptionKey: "projects.previewProject3Description",
            owner_id: "preview-user",
            status: "done",
            created_at: new Date("2026-04-18").toISOString()
        }
    ];
    function getPreviewProjects() {
        return PREVIEW_PROJECT_BLUEPRINTS.map((project) => ({
            id: project.id,
            name: i18n(project.nameKey),
            description: i18n(project.descriptionKey),
            owner_id: project.owner_id,
            status: project.status,
            created_at: project.created_at
        }));
    }
    let currentUser = null;
    let isPreviewMode = false;
    let userNameElement = null;
    let userAvatarElement = null;
    let projectsMessageBox = null;
    let projectsBoardElement = null;
    let allProjects = [];
    let currentProjectView = "grid";
    let boardRenderState = "loading";
    let lastBoardErrorText = "";
    let projectViewButtons;
    let logoutButton = null;
    let themeToggleButton = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    let projectCompletionLookup = new Map();
    document.addEventListener("DOMContentLoaded", () => {
        void initializeProjectsPage();
    });
    async function initializeProjectsPage() {
        cacheElements();
        initializeTheme();
        syncSidebarState();
        setupEventListeners();
        applyStoredProjectView();
        const token = getStoredToken();
        if (!token) {
            await loadPreviewProjectsBoard();
            return;
        }
        renderBoardLoading();
        await loadUserData();
        await loadProjects();
    }
    function cacheElements() {
        userNameElement = document.getElementById("user-name");
        userAvatarElement = document.getElementById("user-avatar");
        projectsMessageBox = document.getElementById("projects-message");
        projectsBoardElement = document.getElementById("projects-board");
        projectViewButtons = document.querySelectorAll("[data-project-view]");
        logoutButton = document.getElementById("logout-btn");
        themeToggleButton = document.getElementById("theme-toggle-btn");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
        if (userNameElement) {
            userNameElement.textContent = "";
        }
    }
    function setupEventListeners() {
        logoutButton?.addEventListener("click", logout);
        themeToggleButton?.addEventListener("click", toggleTheme);
        sidebarToggleButton?.addEventListener("click", toggleSidebar);
        sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
        window.addEventListener("resize", syncSidebarState);
        document.addEventListener("keydown", handleEscapeKey);
        projectsBoardElement?.addEventListener("click", handleProjectCardClick);
        projectViewButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const view = button.dataset.projectView;
                if (view === "grid" || view === "list") {
                    setProjectView(view);
                }
            });
        });
        document.addEventListener("app-language-change", handleLanguageChange);
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
    function readStoredProjectView() {
        const value = localStorage.getItem(DEFAULT_PROJECT_VIEW_STORAGE_KEY);
        return value === "list" ? "list" : "grid";
    }
    function applyStoredProjectView() {
        currentProjectView = readStoredProjectView();
        renderProjectViewButtons();
        if (!projectsBoardElement) {
            return;
        }
        projectsBoardElement.className = currentProjectView === "list"
            ? "projects-grid projects-view-list"
            : "projects-grid projects-view-grid";
    }
    function setProjectView(view) {
        currentProjectView = view;
        localStorage.setItem(DEFAULT_PROJECT_VIEW_STORAGE_KEY, view);
        applyStoredProjectView();
    }
    function renderProjectViewButtons() {
        projectViewButtons.forEach((button) => {
            const isActive = button.dataset.projectView === currentProjectView;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
            button.setAttribute("aria-label", button.dataset.projectView === "list" ? i18n("projects.viewListAria") : i18n("projects.viewGridAria"));
        });
    }
    function handleLanguageChange() {
        renderProjectViewButtons();
        syncSidebarState();
        refreshProjectCompletionLookupLabels();
        if (boardRenderState === "ready") {
            renderProjectsBoard(allProjects);
            return;
        }
        if (boardRenderState === "error") {
            renderBoardError(lastBoardErrorText);
            return;
        }
        renderBoardLoading();
    }
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            void refreshProjectCardsFromIndexedDb();
        }
    });
    window.addEventListener("focus", () => {
        void refreshProjectCardsFromIndexedDb();
    });
    window.addEventListener("pageshow", () => {
        void refreshProjectCardsFromIndexedDb();
    });
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
        sidebarToggleButton.setAttribute("aria-label", document.body.classList.contains("sidebar-open") ? i18n("app.aria.closeNavigationMenu") : i18n("app.aria.openNavigationMenu"));
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
    async function loadPreviewProjectsBoard() {
        isPreviewMode = true;
        currentUser = {
            id: "preview-user",
            name: "Anna Ivanova",
            email: "anna.ivanova@example.com"
        };
        renderUserName();
        updateUserAvatar(getDisplayName(i18n("common.unavailable")));
        allProjects = getPreviewProjects();
        showProjectsMessage("", "success", "projects.preview");
        await refreshProjectCompletionLookup(allProjects);
        renderProjectsBoard(allProjects);
    }
    async function loadUserData() {
        try {
            const data = await requestWithAuth("/auth/me");
            currentUser = data.user;
            renderUserName();
            updateUserAvatar(getDisplayName(i18n("common.unavailable")));
        }
        catch (error) {
            console.error("Error loading user data:", error);
            if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
                return;
            }
            renderUserName(i18n("common.unavailable"));
            updateUserAvatar(i18n("common.unavailable"));
        }
    }
    function renderUserName(fallback = "") {
        if (!userNameElement) {
            return;
        }
        userNameElement.textContent = getDisplayName(fallback);
    }
    function getDisplayName(fallback = "") {
        const storedName = readStoredProfileName();
        return storedName || currentUser?.name?.trim() || fallback;
    }
    function readStoredProfileName() {
        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (!raw) {
                return "";
            }
            const parsed = JSON.parse(raw);
            return typeof parsed?.profileName === "string" ? parsed.profileName.trim() : "";
        }
        catch (error) {
            console.warn("Failed to read stored profile name:", error);
            return "";
        }
    }
    async function loadProjects() {
        showProjectsMessage("");
        renderBoardLoading();
        try {
            const data = await requestWithAuth("/projects");
            allProjects = Array.isArray(data.projects) ? data.projects : [];
            await refreshProjectCompletionLookup(allProjects);
            renderProjectsBoard(allProjects);
        }
        catch (error) {
            console.error("Error loading projects:", error);
            if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
                return;
            }
            renderBoardError(getErrorText(error, i18n("dashboard.projectsUnavailable")));
        }
    }
    function renderBoardLoading() {
        if (!projectsBoardElement) {
            return;
        }
        boardRenderState = "loading";
        applyStoredProjectView();
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
        boardRenderState = "ready";
        applyStoredProjectView();
        persistKnownProjects(projects);
        if (!projects.length) {
            projectsBoardElement.innerHTML = `
        <article class="state-card empty-state-card">
          <h3>${escapeHtml(i18n("dashboard.noProjects"))}</h3>
          <p>${escapeHtml(i18n("dashboard.noProjectsText"))}</p>
        </article>
      `;
            return;
        }
        projectsBoardElement.innerHTML = projects.map((project) => renderProjectCard(project)).join("");
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
    function renderProjectCard(project) {
        const creatorName = escapeHtml(getDisplayName(i18n("common.you")));
        const progress = getProjectCompletionSummary(project.id);
        const description = project.description?.trim()
            ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
            : `<p class="project-description is-empty">${escapeHtml(i18n("dashboard.projectDescriptionPlaceholder"))}</p>`;
        const normalizedStatus = project.status.trim().toLowerCase();
        const query = new URLSearchParams({
            projectId: project.id,
            projectName: project.name,
            status: formatStatus(project.status),
            statusKey: getProjectContextStatusKey(project.status),
            creator: getDisplayName(i18n("common.you")),
            createdAt: project.created_at
        }).toString();
        return `
      <a class="project-card project-card-link" href="./tasks.html?${query}" data-project-id="${escapeHtml(project.id)}" data-project-name="${escapeHtml(project.name)}" data-project-status="${escapeHtml(getColumnId(project.status))}" data-project-status-label="${escapeHtml(formatStatus(project.status))}" data-project-status-key="${escapeHtml(getProjectContextStatusKey(project.status))}" data-project-creator="${escapeHtml(getDisplayName(i18n("common.you")))}" data-project-created-at="${escapeHtml(project.created_at)}">
        <div class="project-head">
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <span class="project-task-count">${escapeHtml(i18n("common.tasksCount", { count: progress.totalTasks }))}</span>
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
        <div class="project-progress-row project-progress-tone-${escapeHtml(progress.tone)}">
          <div
            class="project-progress-track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${progress.percentage}"
            aria-label="${escapeHtml(progress.label)}"
          >
            <span class="project-progress-fill" style="width: ${progress.percentage}%;"></span>
          </div>
          <span class="project-progress-text">${escapeHtml(progress.label)}</span>
        </div>
        <p class="project-progress-counter">${escapeHtml(progress.counterLabel)}</p>
      </a>
    `;
    }
    function renderBoardError(text) {
        if (!projectsBoardElement) {
            return;
        }
        boardRenderState = "error";
        lastBoardErrorText = text;
        applyStoredProjectView();
        projectsBoardElement.innerHTML = `
      <article class="state-card">
        <h3>${escapeHtml(i18n("dashboard.projectsUnavailable"))}</h3>
        <p>${escapeHtml(text)}</p>
      </article>
    `;
    }
function showProjectsMessage(text, type, key = "", values) {
    if (!projectsMessageBox) {
        return;
    }
    if (key) {
        setDynamicText(projectsMessageBox, key, values);
    }
    else {
        clearDynamicText(projectsMessageBox);
        projectsMessageBox.textContent = text;
    }
    projectsMessageBox.className = type ? `form-message ${type}` : "form-message";
}
    function handleProjectCardClick(event) {
        const target = event.target;
        const projectCard = target?.closest(".project-card-link");
        if (!projectCard) {
            return;
        }
        const projectId = projectCard.dataset.projectId || "";
        const projectName = projectCard.dataset.projectName || "";
        const status = projectCard.dataset.projectStatusLabel || "";
        const statusKey = projectCard.dataset.projectStatusKey || "";
        const creator = projectCard.dataset.projectCreator || "";
        const createdAt = projectCard.dataset.projectCreatedAt || "";
        localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify({
            projectId,
            projectName,
            status,
            statusKey,
            creator,
            createdAt
        }));
    }
    function persistKnownProjects(projects) {
        const creator = getDisplayName(i18n("common.you"));
        const serializedProjects = projects.map((project) => ({
            projectId: project.id,
            projectName: project.name,
            status: formatStatus(project.status),
            statusKey: getProjectContextStatusKey(project.status),
            creator,
            createdAt: project.created_at
        }));
        localStorage.setItem(KNOWN_PROJECTS_STORAGE_KEY, JSON.stringify(serializedProjects.slice(0, 48)));
    }
async function refreshProjectCompletionLookup(projects) {
    projectCompletionLookup = await readProjectCompletionLookup(projects);
}
function refreshProjectCompletionLookupLabels() {
    projectCompletionLookup.forEach((summary, projectId) => {
        projectCompletionLookup.set(projectId, {
            percentage: summary.percentage,
            tone: summary.tone,
            label: formatProjectCompletionLabel(summary.percentage),
            totalTasks: summary.totalTasks,
            completedTasks: summary.completedTasks,
            counterLabel: formatProjectCompletionCounter(summary.completedTasks, summary.totalTasks)
        });
    });
}
async function refreshProjectCardsFromIndexedDb() {
    if (boardRenderState !== "ready" || allProjects.length === 0) {
        return;
    }
    await refreshProjectCompletionLookup(allProjects);
    renderProjectsBoard(allProjects);
}
    async function readProjectCompletionLookup(projects) {
        const lookup = new Map();
        const projectIds = projects
            .map((project) => getProjectIdKey(project.id))
            .filter(Boolean);
        projectIds.forEach((projectId) => {
            lookup.set(projectId, createProjectCompletionSummary(0, 0));
        });
        if (projectIds.length === 0 || !window.indexedDB) {
            return lookup;
        }
        try {
            const tasks = await readIndexedDbTasks();
            const totalByProjectId = new Map();
            const completedByProjectId = new Map();
            tasks.forEach((task) => {
                const projectId = getProjectIdKey(task?.projectId);
                if (!projectId || !lookup.has(projectId)) {
                    return;
                }
                totalByProjectId.set(projectId, (totalByProjectId.get(projectId) || 0) + 1);
                if (isCompletedTaskStatus(task?.status)) {
                    completedByProjectId.set(projectId, (completedByProjectId.get(projectId) || 0) + 1);
                }
            });
            projectIds.forEach((projectId) => {
                lookup.set(projectId, createProjectCompletionSummary(totalByProjectId.get(projectId) || 0, completedByProjectId.get(projectId) || 0));
            });
        }
        catch (error) {
            console.warn("Error reading project completion from IndexedDB:", error);
        }
        return lookup;
    }
    async function readIndexedDbTasks() {
        if (!window.indexedDB) {
            return [];
        }
        return await new Promise((resolve, reject) => {
            const openRequest = window.indexedDB.open(DB_NAME, DB_VERSION);
            openRequest.onupgradeneeded = () => {
                const database = openRequest.result;
                if (!database.objectStoreNames.contains(TASKS_STORE_NAME)) {
                    database.createObjectStore(TASKS_STORE_NAME, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                }
            };
            openRequest.onerror = () => {
                reject(openRequest.error || new Error("Failed to open IndexedDB."));
            };
            openRequest.onsuccess = () => {
                const database = openRequest.result;
                let settled = false;
                const finish = (callback) => {
                    if (settled) {
                        return;
                    }
                    settled = true;
                    database.close();
                    callback();
                };
                if (!database.objectStoreNames.contains(TASKS_STORE_NAME)) {
                    finish(() => resolve([]));
                    return;
                }
                const transaction = database.transaction(TASKS_STORE_NAME, "readonly");
                const request = transaction.objectStore(TASKS_STORE_NAME).getAll();
                request.onerror = () => {
                    finish(() => reject(request.error || new Error("Failed to read IndexedDB tasks.")));
                };
                request.onsuccess = () => {
                    const tasks = Array.isArray(request.result) ? request.result : [];
                    finish(() => resolve(tasks));
                };
                transaction.onabort = () => {
                    finish(() => reject(transaction.error || new Error("IndexedDB task read was aborted.")));
                };
            };
        });
    }
    function getProjectCompletionSummary(projectId) {
        return projectCompletionLookup.get(getProjectIdKey(projectId)) || createProjectCompletionSummary(0, 0);
    }
    function getProjectIdKey(projectId) {
        if (projectId === null || projectId === undefined) {
            return "";
        }
        return String(projectId).trim();
    }
function createProjectCompletionSummary(totalTasks, completedTasks) {
    const safeTotalTasks = Math.max(0, totalTasks);
    const safeCompletedTasks = Math.min(Math.max(0, completedTasks), safeTotalTasks);
        const percentage = safeTotalTasks > 0
            ? Math.round((safeCompletedTasks / safeTotalTasks) * 100)
            : 0;
    return {
        percentage,
        tone: getProjectCompletionTone(percentage),
        label: formatProjectCompletionLabel(percentage),
        totalTasks: safeTotalTasks,
        completedTasks: safeCompletedTasks,
        counterLabel: formatProjectCompletionCounter(safeCompletedTasks, safeTotalTasks)
    };
}
    function getProjectCompletionTone(percentage) {
        if (percentage <= 30) {
            return "low";
        }
        if (percentage <= 60) {
            return "medium";
        }
        return "high";
    }
function formatProjectCompletionLabel(percentage) {
    return i18n("common.percentComplete", { percent: percentage });
}
function formatProjectCompletionCounter(completedTasks, totalTasks) {
    if (totalTasks <= 0) {
        return i18n("common.noTasksYet");
    }
    return i18n("common.tasksCompletedCounter", { completed: completedTasks, total: totalTasks });
}
    function isCompletedTaskStatus(status) {
        return typeof status === "string" && status.trim().toLowerCase() === "done";
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
    function updateUserAvatar(name) {
        if (!userAvatarElement) {
            return;
        }
        userAvatarElement.textContent = getInitials(name);
    }
    function getInitials(name) {
        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (parts.length === 0) {
            return "U";
        }
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
        const normalizedStatus = getColumnId(status);
        if (normalizedStatus === "start-next") {
            return i18n("projects.startNext");
        }
        if (normalizedStatus === "in-progress") {
            return i18n("projects.inProgress");
        }
        return i18n("projects.done");
    }
    function getProjectContextStatusKey(status) {
        const normalizedStatus = getColumnId(status);
        if (normalizedStatus === "start-next") {
            return "projects.startNext";
        }
        if (normalizedStatus === "in-progress") {
            return "projects.inProgress";
        }
        return "projects.done";
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
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
})(ProjectsPage || (ProjectsPage = {}));
//# sourceMappingURL=projects.js.map

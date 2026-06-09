"use strict";
const API_BASE_URL = `${window.location.origin}/api`;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
const THEME_STORAGE_KEY = "dashboard-theme";
const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
const DEFAULT_PROJECT_VIEW_STORAGE_KEY = "defaultProjectView";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const DB_NAME = "SPMP_DB";
const DB_VERSION = 1;
const TASKS_STORE_NAME = "tasks";
const PROJECT_STATUS_CHART_COLORS = ["#94A3B8", "#22C55E", "#F59E0B", "#6366F1"];
const TASK_OVERVIEW_CHART_COLORS = ["#94A3B8", "#F59E0B", "#22C55E"];
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
let isPreviewMode = false;
const PREVIEW_PROJECT_BLUEPRINTS = [
    {
        id: "preview-1",
        nameKey: "dashboard.previewProject1Name",
        descriptionKey: "dashboard.previewProject1Description",
        owner_id: "preview-user",
        status: "active",
        created_at: new Date("2026-03-12").toISOString()
    },
    {
        id: "preview-2",
        nameKey: "dashboard.previewProject2Name",
        descriptionKey: "dashboard.previewProject2Description",
        owner_id: "preview-user",
        status: "in-review",
        created_at: new Date("2026-04-02").toISOString()
    },
    {
        id: "preview-3",
        nameKey: "dashboard.previewProject3Name",
        descriptionKey: "dashboard.previewProject3Description",
        owner_id: "preview-user",
        status: "planning",
        created_at: new Date("2026-04-18").toISOString()
    }
];
let currentUser = null;
let userNameElement = null;
let userAvatarElement = null;
let greetingTitleElement = null;
let greetingDateElement = null;
let projectsMessageBox = null;
let projectsListElement = null;
let projectSearchInputElement = null;
let projectSortSelectElement = null;
let projectFilterButtons;
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
let allProjects = [];
let projectCompletionLookup = new Map();
let projectStatusChartCanvas = null;
let taskOverviewChartCanvas = null;
let projectStatusChart = null;
let taskOverviewChart = null;
let taskStatusCounts = createTaskStatusCounts();
let currentProjectView = "grid";
let projectsRenderState = "loading";
let lastProjectsErrorText = "";
let greetingRefreshIntervalId = 0;
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
document.addEventListener("DOMContentLoaded", () => {
    void initializeDashboard();
});
async function initializeDashboard() {
    cacheElements();
    applyStoredProjectView();
    initializeTheme();
    refreshGreetingBanner();
    startGreetingRefreshTimer();
    syncSidebarState();
    setupEventListeners();
    await initializeDashboardCharts();
    const token = getStoredToken();
    if (!token) {
        redirectToLogin();
        return;
    }
    renderProjectsLoading();
    await loadUserData();
    await loadProjects();
}
async function initializeDashboardCharts() {
    await refreshTaskStatusCounts();
    renderDashboardCharts();
}
function cacheElements() {
    userNameElement = document.getElementById("user-name");
    userAvatarElement = document.getElementById("user-avatar");
    greetingTitleElement = document.getElementById("local-greeting-title");
    greetingDateElement = document.getElementById("local-greeting-date");
    projectsMessageBox = document.getElementById("projects-message");
    projectsListElement = document.getElementById("projects-list");
    projectSearchInputElement = document.getElementById("project-search-input");
    projectSortSelectElement = document.getElementById("project-sort-select");
    projectFilterButtons = document.querySelectorAll(".filter-button");
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
    projectStatusChartCanvas = document.getElementById("project-status-chart");
    taskOverviewChartCanvas = document.getElementById("task-overview-chart");
    if (userNameElement) {
        userNameElement.textContent = "";
    }
}
function readStoredProjectView() {
    const value = localStorage.getItem(DEFAULT_PROJECT_VIEW_STORAGE_KEY);
    return value === "list" ? "list" : "grid";
}
function applyStoredProjectView() {
    currentProjectView = readStoredProjectView();
    if (!projectsListElement) {
        return;
    }
    projectsListElement.className = currentProjectView === "list"
        ? "projects-grid projects-view-list"
        : "projects-grid projects-view-grid";
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
    projectSearchInputElement?.addEventListener("input", handleProjectSearchInput);
    projectSearchInputElement?.addEventListener("search", handleProjectSearchInput);
    projectSortSelectElement?.addEventListener("change", handleProjectSortChange);
    projectFilterButtons.forEach((button) => {
        button.addEventListener("click", handleProjectFilterClick);
    });
    window.addEventListener("resize", syncSidebarState);
    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("app-language-change", handleLanguageChange);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            refreshGreetingBanner();
            void refreshProjectCardsFromIndexedDb();
        }
    });
    window.addEventListener("focus", refreshGreetingBanner);
    window.addEventListener("focus", () => {
        void refreshProjectCardsFromIndexedDb();
    });
    window.addEventListener("pageshow", refreshGreetingBanner);
    window.addEventListener("pageshow", () => {
        void refreshProjectCardsFromIndexedDb();
    });
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
        renderDashboardCharts();
        return;
    }
    const isDarkTheme = theme === "dark";
    themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
    themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
    themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
    renderDashboardCharts();
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
async function loadPreviewDashboard() {
    isPreviewMode = true;
    currentUser = {
        id: "preview-user",
        name: "Regular User",
        email: "user@email.com"
    };
    renderUserName();
    refreshGreetingBanner();
    showProjectsMessage("", "success", "dashboard.preview");
    allProjects = getPreviewProjects();
    await refreshProjectCompletionLookup(allProjects);
    renderVisibleProjects();
}
async function loadUserData() {
    try {
        const data = await requestWithAuth("/auth/me");
        currentUser = data.user;
        renderUserName();
        refreshGreetingBanner();
    }
    catch (error) {
        console.error("Error loading user data:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            redirectToLogin();
            return;
        }
        renderUserName(i18n("common.unavailable"));
        refreshGreetingBanner();
    }
}
function renderUserName(fallback = "") {
    if (!userNameElement) {
        return;
    }
    const name = getDisplayName(fallback);
    userNameElement.textContent = name;
    updateUserAvatar(name);
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
async function loadProjects(options = {}) {
    if (!options.preserveMessage) {
        showProjectsMessage("");
    }
    renderProjectsLoading();
    try {
        const data = await requestWithAuth("/projects");
        allProjects = Array.isArray(data.projects) ? data.projects : [];
        await refreshProjectCompletionLookup(allProjects);
        renderVisibleProjects();
    }
    catch (error) {
        console.error("Error loading projects:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        renderProjectsError(getErrorText(error, i18n("dashboard.projectsLoadFailed")));
    }
}
function renderProjectsLoading() {
    if (!projectsListElement) {
        return;
    }
    projectsRenderState = "loading";
    applyStoredProjectView();
    projectsListElement.innerHTML = `
    ${Array.from({ length: 3 }, () => `
      <article class="project-card skeleton-card" aria-hidden="true">
        <div class="skeleton-line skeleton-line-title"></div>
        <div class="skeleton-line skeleton-line-badge"></div>
        <div class="skeleton-line skeleton-line-body"></div>
        <div class="skeleton-line skeleton-line-body is-short"></div>
        <div class="skeleton-line skeleton-line-footer"></div>
      </article>
    `).join("")}
  `;
    renderProjectStatusChart();
}
function renderProjects(projects) {
    if (!projectsListElement) {
        return;
    }
    projectsRenderState = "ready";
    applyStoredProjectView();
    if (projects.length === 0) {
        projectsListElement.innerHTML = `
      <article class="state-card empty-state-card">
        <div class="empty-state-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 120" class="empty-state-svg" focusable="false">
            <rect x="26" y="24" width="108" height="72" rx="14"></rect>
            <rect x="42" y="40" width="38" height="8" rx="4"></rect>
            <rect x="42" y="56" width="62" height="6" rx="3"></rect>
            <rect x="42" y="68" width="48" height="6" rx="3"></rect>
            <circle cx="116" cy="52" r="10"></circle>
            <path d="M118 18l6 8"></path>
            <path d="M30 96l10-10"></path>
          </svg>
        </div>
      <h3>${escapeHtml(i18n("dashboard.noProjects"))}</h3>
      <p>${escapeHtml(i18n("dashboard.noProjectsText"))}</p>
      <button type="button" class="submit-button empty-state-action" id="empty-state-create-project-btn">${escapeHtml(i18n("dashboard.createProject"))}</button>
      </article>
    `;
        document.getElementById("empty-state-create-project-btn")?.addEventListener("click", openProjectModal, { once: true });
        renderProjectStatusChart();
        return;
    }
    projectsListElement.innerHTML = projects.map((project, index) => {
        const creatorName = escapeHtml(getDisplayName(i18n("common.you")));
        const normalizedStatus = getNormalizedProjectStatus(project.status);
        const statusIndicator = getStatusIconMarkup(normalizedStatus);
        const progress = getProjectCompletionSummary(project.id);
        const description = project.description?.trim()
            ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
            : `<p class="project-description is-empty">${escapeHtml(i18n("dashboard.projectFallbackDescription"))}</p>`;
        const query = new URLSearchParams({
            projectId: project.id,
            projectName: project.name,
            status: formatStatus(project.status),
            statusKey: getProjectStatusKey(project.status),
            creator: getDisplayName(i18n("common.you")),
            createdAt: project.created_at
        }).toString();
        return `
      <a class="project-card project-card-link" href="./tasks.html?${query}" data-project-id="${escapeHtml(project.id)}" data-project-status="${escapeHtml(normalizedStatus)}">
        <div class="project-head">
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <span class="project-task-count">${escapeHtml(i18n("common.tasksCount", { count: progress.totalTasks }))}</span>
          </div>
          <span class="project-status">${statusIndicator}${escapeHtml(formatStatus(project.status))}</span>
        </div>
        ${description}
        <div class="project-meta">
          <span class="project-owner">${creatorName}</span>
          <span>${escapeHtml(formatProjectDate(project.created_at))}</span>
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
    }).join("");
    renderProjectStatusChart();
}
function renderProjectsError(text) {
    if (!projectsListElement) {
        return;
    }
    projectsRenderState = "error";
    lastProjectsErrorText = text;
    applyStoredProjectView();
    projectsListElement.innerHTML = `
    <article class="state-card">
      <h3>${escapeHtml(i18n("dashboard.projectsUnavailable"))}</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
    renderProjectStatusChart();
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
        showProjectFormMessage("", "error", "dashboard.validation.fix");
        return;
    }
    setProjectSubmitting(true);
    try {
        if (isPreviewMode && currentUser) {
            allProjects.unshift({
                id: `preview-${Date.now()}`,
                name,
                description: description || null,
                owner_id: currentUser.id,
                status: "planning",
                created_at: new Date().toISOString()
            });
            closeProjectModal();
            showProjectsMessage("", "success", "dashboard.previewProjectCreated");
            await refreshProjectCompletionLookup(allProjects);
            renderVisibleProjects();
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
        showProjectsMessage("", "success", "dashboard.projectCreated");
        await loadProjects({ preserveMessage: true });
    }
    catch (error) {
        console.error("Error creating project:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        showProjectFormMessage(getErrorText(error, i18n("dashboard.projectCreateFailed")), "error", error instanceof Error && error.message.trim() ? "" : "dashboard.projectCreateFailed");
    }
    finally {
        setProjectSubmitting(false);
    }
}
function validateProjectForm(name, description) {
    let isValid = true;
    if (!name) {
        setProjectFieldError("project-name", "dashboard.validation.projectRequired");
        isValid = false;
    }
    else if (name.length < 2) {
        setProjectFieldError("project-name", "dashboard.validation.projectShort");
        isValid = false;
    }
    if (description.length > 500) {
        setProjectFieldError("project-description", "dashboard.validation.projectDescriptionLong");
        isValid = false;
    }
    return isValid;
}
function setProjectFieldError(fieldId, key) {
    const input = document.getElementById(fieldId);
    const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`);
    input?.classList.add("input-error");
    if (errorBox) {
        setDynamicText(errorBox, key);
    }
}
function resetProjectFormErrors() {
    showProjectFormMessage("");
    projectFormElement?.querySelectorAll(".field-error").forEach((element) => {
        clearDynamicText(element);
        element.textContent = "";
    });
    projectFormElement?.querySelectorAll(".input-error").forEach((element) => {
        element.classList.remove("input-error");
    });
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
function showProjectFormMessage(text, type, key = "", values) {
    if (!projectFormMessageBox) {
        return;
    }
    if (key) {
        setDynamicText(projectFormMessageBox, key, values);
    }
    else {
        clearDynamicText(projectFormMessageBox);
        projectFormMessageBox.textContent = text;
    }
    projectFormMessageBox.className = type ? `form-message ${type}` : "form-message";
}
function setProjectSubmitting(isSubmitting) {
    if (!projectSubmitButton) {
        return;
    }
    projectSubmitButton.disabled = isSubmitting;
    if (isSubmitting) {
        setDynamicText(projectSubmitButton, "dashboard.projectSubmitting");
        return;
    }
    clearDynamicText(projectSubmitButton);
    projectSubmitButton.textContent = i18n("dashboard.projectSubmit");
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
function handleProjectSortChange() {
    renderVisibleProjects();
}
function handleProjectSearchInput() {
    renderVisibleProjects();
}
function handleProjectFilterClick(event) {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
        return;
    }
    setActiveProjectFilter(button.value);
    renderVisibleProjects();
}
function handleLanguageChange() {
    renderUserName(currentUser ? "" : i18n("common.unavailable"));
    refreshGreetingBanner();
    updateDashboardChartTranslations();
    syncSidebarState();
    setProjectSubmitting(Boolean(projectSubmitButton?.disabled));
    if (projectsRenderState === "ready") {
        refreshProjectCompletionLookupLabels();
        renderVisibleProjects();
        return;
    }
    if (projectsRenderState === "error") {
        renderProjectsError(lastProjectsErrorText);
        return;
    }
    renderProjectsLoading();
}
function updateDashboardChartTranslations() {
    if (projectStatusChart) {
        projectStatusChart.data.labels = getProjectStatusChartLabels();
        projectStatusChart.update();
    }
    if (taskOverviewChart) {
        taskOverviewChart.data.labels = getTaskOverviewChartLabels();
        taskOverviewChart.update();
    }
}
function refreshGreetingBanner() {
    const today = new Date();
    const displayName = getDisplayName();
    const greetingKey = getGreetingFallbackKey(today.getHours());
    const greeting = i18n(greetingKey);
    if (greetingTitleElement) {
        greetingTitleElement.textContent = displayName ? `${greeting}, ${displayName}` : greeting;
    }
    if (greetingDateElement) {
        greetingDateElement.textContent = formatGreetingDate(today);
        greetingDateElement.dateTime = today.toISOString().slice(0, 10);
    }
}
function getGreetingFallbackKey(hour) {
    if (hour >= 5 && hour < 12) {
        return "dashboard.greetingMorningFallback";
    }
    if (hour >= 12 && hour < 18) {
        return "dashboard.greetingAfternoonFallback";
    }
    if (hour >= 18 && hour < 22) {
        return "dashboard.greetingEveningFallback";
    }
    return "dashboard.greetingNightFallback";
}
function startGreetingRefreshTimer() {
    if (greetingRefreshIntervalId) {
        return;
    }
    greetingRefreshIntervalId = window.setInterval(refreshGreetingBanner, 60000);
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
function getStoredToken() {
    return localStorage.getItem("spmp-csrf-token")?.trim() || "";
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
function getNormalizedProjectStatus(status) {
    const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
    if (normalizedStatus === "active") {
        return "active";
    }
    if (["in-progress", "in progress", "in-review", "in review", "review", "blocked"].includes(normalizedStatus)) {
        return "in-review";
    }
    if (["planning", "planned", "start-next", "queued"].includes(normalizedStatus)) {
        return "planning";
    }
    if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(normalizedStatus)) {
        return "done";
    }
    return normalizedStatus;
}
function readSelectedSort() {
    const value = projectSortSelectElement?.value;
    if (value === "oldest" || value === "az") {
        return value;
    }
    return "newest";
}
function readSelectedFilter() {
    const activeButton = Array.from(projectFilterButtons || []).find((button) => button.classList.contains("is-active"));
    const value = activeButton?.value;
    if (value === "active" || value === "in-review" || value === "planning") {
        return value;
    }
    return "all";
}
function readSearchTerm() {
    return projectSearchInputElement?.value.trim().toLowerCase() || "";
}
function setActiveProjectFilter(filter) {
    const nextFilter = filter === "active" || filter === "in-review" || filter === "planning" ? filter : "all";
    projectFilterButtons.forEach((button) => {
        const isActive = button.value === nextFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}
function renderVisibleProjects() {
    renderProjects(getVisibleProjects());
}
function getVisibleProjects() {
    const searchTerm = readSearchTerm();
    const selectedFilter = readSelectedFilter();
    const filteredProjects = allProjects.filter((project) => matchesProjectSearch(project, searchTerm) && matchesProjectStatus(project, selectedFilter));
    return sortProjects(filteredProjects, readSelectedSort());
}
function matchesProjectSearch(project, searchTerm) {
    if (!searchTerm) {
        return true;
    }
    const name = typeof project.name === "string" ? project.name : "";
    const description = typeof project.description === "string" ? project.description : "";
    return `${name} ${description}`.toLowerCase().includes(searchTerm);
}
function matchesProjectStatus(project, filter) {
    if (filter === "all") {
        return true;
    }
    return getNormalizedProjectStatus(project.status) === filter;
}
function renderDashboardCharts() {
    renderProjectStatusChart();
    renderTaskOverviewChart();
}
function getProjectStatusChartLabels() {
    return [
        i18n("status.planning"),
        i18n("status.active"),
        i18n("status.inReview"),
        i18n("status.done")
    ];
}
function getTaskOverviewChartLabels() {
    return [
        i18n("tasks.status.todo"),
        i18n("tasks.status.inProgress"),
        i18n("tasks.status.done")
    ];
}
function renderProjectStatusChart() {
    if (!projectStatusChartCanvas || typeof Chart !== "function") {
        return;
    }
    const counts = readProjectStatusCountsFromCards();
    const themeColors = getDashboardChartThemeColors();
    const data = [counts.planning, counts.active, counts.inReview, counts.done];
    if (projectStatusChart) {
        projectStatusChart.data.datasets[0].data = data;
        projectStatusChart.data.labels = getProjectStatusChartLabels();
        projectStatusChart.data.datasets[0].backgroundColor = PROJECT_STATUS_CHART_COLORS;
        projectStatusChart.data.datasets[0].borderColor = themeColors.surface;
        projectStatusChart.options.plugins.legend.labels.color = themeColors.text;
        projectStatusChart.update();
        return;
    }
    projectStatusChart = new Chart(projectStatusChartCanvas, {
        type: "doughnut",
        data: {
            labels: getProjectStatusChartLabels(),
            datasets: [
                {
                    data,
                    backgroundColor: PROJECT_STATUS_CHART_COLORS,
                    borderColor: themeColors.surface,
                    borderWidth: 2,
                    hoverOffset: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: themeColors.text,
                        boxWidth: 12,
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                }
            }
        }
    });
}
function renderTaskOverviewChart() {
    if (!taskOverviewChartCanvas || typeof Chart !== "function") {
        return;
    }
    const themeColors = getDashboardChartThemeColors();
    const data = [taskStatusCounts.todo, taskStatusCounts.inProgress, taskStatusCounts.done];
    if (taskOverviewChart) {
        taskOverviewChart.data.datasets[0].data = data;
        taskOverviewChart.data.labels = getTaskOverviewChartLabels();
        taskOverviewChart.data.datasets[0].backgroundColor = TASK_OVERVIEW_CHART_COLORS;
        taskOverviewChart.options.plugins.legend.labels.color = themeColors.text;
        taskOverviewChart.options.scales.x.ticks.color = themeColors.text;
        taskOverviewChart.options.scales.y.ticks.color = themeColors.text;
        taskOverviewChart.options.scales.x.grid.color = themeColors.grid;
        taskOverviewChart.options.scales.y.grid.color = themeColors.grid;
        taskOverviewChart.update();
        return;
    }
    taskOverviewChart = new Chart(taskOverviewChartCanvas, {
        type: "bar",
        data: {
            labels: getTaskOverviewChartLabels(),
            datasets: [
                {
                    data,
                    backgroundColor: TASK_OVERVIEW_CHART_COLORS,
                    borderRadius: 10,
                    maxBarThickness: 56
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: themeColors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: themeColors.text
                    },
                    grid: {
                        color: themeColors.grid,
                        drawBorder: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: themeColors.text,
                        precision: 0,
                        stepSize: 1
                    },
                    grid: {
                        color: themeColors.grid,
                        drawBorder: false
                    }
                }
            }
        }
    });
}
function readProjectStatusCountsFromCards() {
    const counts = {
        planning: 0,
        active: 0,
        inReview: 0,
        done: 0
    };
    if (projectsRenderState !== "ready") {
        return counts;
    }
    getVisibleProjects().forEach((project) => {
        const status = getNormalizedProjectStatus(project.status);
        if (status === "planning") {
            counts.planning += 1;
            return;
        }
        if (status === "active") {
            counts.active += 1;
            return;
        }
        if (status === "in-review") {
            counts.inReview += 1;
            return;
        }
        if (status === "done") {
            counts.done += 1;
        }
    });
    return counts;
}
function createTaskStatusCounts() {
    return {
        todo: 0,
        inProgress: 0,
        done: 0
    };
}
async function refreshTaskStatusCounts() {
    taskStatusCounts = createTaskStatusCounts();
    try {
        const tasks = await readIndexedDbTasks();
        tasks.forEach((task) => {
            const normalizedStatus = typeof task?.status === "string" ? task.status.trim().toLowerCase() : "";
            if (normalizedStatus === "todo") {
                taskStatusCounts.todo += 1;
                return;
            }
            if (normalizedStatus === "in progress" || normalizedStatus === "in-progress") {
                taskStatusCounts.inProgress += 1;
                return;
            }
            if (normalizedStatus === "done") {
                taskStatusCounts.done += 1;
            }
        });
    }
    catch (error) {
        console.warn("Error reading task overview from IndexedDB:", error);
    }
    renderTaskOverviewChart();
}
function getDashboardChartThemeColors() {
    const styles = getComputedStyle(document.body);
    if (document.body.dataset.theme !== "dark") {
        return {
            text: "#1E293B",
            surface: "#FFFFFF",
            grid: "rgba(148, 163, 184, 0.18)"
        };
    }
    return {
        text: styles.getPropertyValue("--text").trim() || "#1A202C",
        surface: styles.getPropertyValue("--surface").trim() || "#FFFFFF",
        grid: "rgba(226, 232, 240, 0.12)"
    };
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
    if (projectsRenderState !== "ready" || allProjects.length === 0) {
        return;
    }
    await refreshProjectCompletionLookup(allProjects);
    renderVisibleProjects();
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
function isCompletedTaskStatus(status) {
    return typeof status === "string" && status.trim().toLowerCase() === "done";
}
function sortProjects(projects, sort) {
    const copy = [...projects];
    if (sort === "az") {
        copy.sort((left, right) => left.name.localeCompare(right.name, getCurrentLocale(), { sensitivity: "base" }));
        return copy;
    }
    copy.sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;
        return sort === "oldest" ? safeLeftTime - safeRightTime : safeRightTime - safeLeftTime;
    });
    return copy;
}
async function requestWithAuth(path, init = {}) {
    const token = getStoredToken();
    const headers = new Headers(init.headers);
    if (token) {
        headers.set("X-CSRF-Token", token);
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
    const normalizedStatus = getNormalizedProjectStatus(status);
    if (normalizedStatus === "planning") {
        return i18n("status.planning");
    }
    if (normalizedStatus === "active") {
        return i18n("status.active");
    }
    if (normalizedStatus === "in-review") {
        return i18n("status.inReview");
    }
    if (normalizedStatus === "done") {
        return i18n("status.done");
    }
    return status
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function getProjectStatusKey(status) {
    const normalizedStatus = getNormalizedProjectStatus(status);
    if (normalizedStatus === "planning") {
        return "status.planning";
    }
    if (normalizedStatus === "active") {
        return "status.active";
    }
    if (normalizedStatus === "in-review") {
        return "status.inReview";
    }
    if (normalizedStatus === "done") {
        return "status.done";
    }
    return "";
}
function formatProjectDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return i18n("common.createdRecently");
    }
    return i18n("common.createdDate", { date: date.toLocaleDateString(getCurrentLocale(), {
            month: "short",
            day: "numeric",
            year: "numeric"
        }) });
}
function formatGreetingDate(date) {
    return new Intl.DateTimeFormat(getCurrentLocale(), {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}
function getCurrentLocale() {
    const language = window.I18n?.getLanguage();
    if (language === "zh") {
        return "zh-CN";
    }
    if (language === "es") {
        return "es-ES";
    }
    return "en-US";
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
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
//# sourceMappingURL=dashboard.js.map

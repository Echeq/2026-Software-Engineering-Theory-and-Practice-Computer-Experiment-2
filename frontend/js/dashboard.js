"use strict";
/* Original pre-sidebar layout backed up in ./dashboard.layout-backup.ts */
const API_BASE_URL = `${window.location.origin}/api`;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const i18n = (key, values) => window.I18n?.t(key, values) || key;
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
let userAvatarElement = null;
let greetingTitleElement = null;
let greetingDateElement = null;
let projectsMessageBox = null;
let projectsListElement = null;
let projectSortSelectElement = null;
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
    refreshGreetingBanner();
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
    userAvatarElement = document.getElementById("user-avatar");
    greetingTitleElement = document.getElementById("greeting-banner-title");
    greetingDateElement = document.getElementById("greeting-banner-date");
    projectsMessageBox = document.getElementById("projects-message");
    projectsListElement = document.getElementById("projects-list");
    projectSortSelectElement = document.getElementById("project-sort-select");
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
    projectSortSelectElement?.addEventListener("change", handleProjectSortChange);
    window.addEventListener("resize", syncSidebarState);
    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("app-language-change", refreshGreetingBanner);
    document.addEventListener("htmx:afterSwap", handleProjectsAfterSwap);
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
    updateUserAvatar(currentUser.name);
    refreshGreetingBanner();
    showProjectsMessage(i18n("dashboard.preview"), "success");
    renderProjects(PREVIEW_PROJECTS);
}
async function loadUserData() {
    try {
        const data = await requestWithAuth("/auth/me");
        currentUser = data.user;
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        updateUserAvatar(currentUser.name);
        refreshGreetingBanner();
    }
    catch (error) {
        console.error("Error loading user data:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        if (userNameElement) {
            userNameElement.textContent = i18n("common.unavailable");
        }
        updateUserAvatar(i18n("common.unavailable"));
        refreshGreetingBanner();
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
}
function renderProjects(projects) {
    if (!projectsListElement) {
        return;
    }
    const sortedProjects = sortProjects(projects, readSelectedSort());
    if (sortedProjects.length === 0) {
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
        return;
    }
    projectsListElement.innerHTML = sortedProjects.map((project) => {
        const creatorName = escapeHtml(currentUser?.name || "You");
        const taskCount = typeof project.taskCount === "number" ? project.taskCount : 0;
        const normalizedStatus = project.status.trim().toLowerCase();
        const statusIndicator = getStatusIconMarkup(normalizedStatus);
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
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <span class="project-task-count">${escapeHtml(i18n("common.tasksCount", { count: taskCount }))}</span>
          </div>
          <span class="project-status">${statusIndicator}${escapeHtml(formatStatus(project.status))}</span>
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
      <h3>${escapeHtml(i18n("dashboard.projectsUnavailable"))}</h3>
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
        showProjectFormMessage(i18n("dashboard.validation.fix"), "error");
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
            showProjectsMessage(i18n("dashboard.previewProjectCreated"), "success");
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
        showProjectsMessage(i18n("dashboard.projectCreated"), "success");
        await loadProjects({ preserveMessage: true });
    }
    catch (error) {
        console.error("Error creating project:", error);
        if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
            return;
        }
        showProjectFormMessage(getErrorText(error, i18n("dashboard.projectCreateFailed")), "error");
    }
    finally {
        setProjectSubmitting(false);
    }
}
function validateProjectForm(name, description) {
    let isValid = true;
    if (!name) {
        setProjectFieldError("project-name", i18n("dashboard.validation.projectRequired"));
        isValid = false;
    }
    else if (name.length < 2) {
        setProjectFieldError("project-name", i18n("dashboard.validation.projectShort"));
        isValid = false;
    }
    if (description.length > 500) {
        setProjectFieldError("project-description", i18n("dashboard.validation.projectDescriptionLong"));
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
    projectSubmitButton.textContent = isSubmitting ? i18n("dashboard.projectSubmitting") : i18n("dashboard.projectSubmit");
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
    sortRenderedProjectCards();
}
function handleProjectsAfterSwap(event) {
    const customEvent = event;
    if (!(customEvent.target instanceof HTMLElement) || customEvent.target.id !== "projects-list") {
        return;
    }
    document.getElementById("empty-state-create-project-btn")?.addEventListener("click", openProjectModal, { once: true });
    sortRenderedProjectCards();
}
function refreshGreetingBanner() {
    const today = new Date();
    const displayName = currentUser?.name.trim() || "";
    if (greetingTitleElement) {
        greetingTitleElement.textContent = displayName
            ? i18n("dashboard.greetingMorning", { name: displayName })
            : i18n("dashboard.greetingMorningFallback");
    }
    if (greetingDateElement) {
        greetingDateElement.textContent = formatGreetingDate(today);
        greetingDateElement.dateTime = today.toISOString().slice(0, 10);
    }
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
function readSelectedSort() {
    const value = projectSortSelectElement?.value;
    if (value === "oldest" || value === "az") {
        return value;
    }
    return "newest";
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
function sortRenderedProjectCards() {
    if (!projectsListElement) {
        return;
    }
    const cards = Array.from(projectsListElement.querySelectorAll(".project-card-link"));
    if (cards.length <= 1) {
        return;
    }
    const sort = readSelectedSort();
    const collator = new Intl.Collator(getCurrentLocale(), { sensitivity: "base" });
    cards.sort((left, right) => {
        if (sort === "az") {
            return collator.compare(readProjectName(left), readProjectName(right));
        }
        const leftTime = readProjectCreatedAt(left);
        const rightTime = readProjectCreatedAt(right);
        return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });
    cards.forEach((card) => {
        projectsListElement?.appendChild(card);
    });
}
function readProjectName(card) {
    return card.querySelector(".project-name")?.textContent?.trim() || "";
}
function readProjectCreatedAt(card) {
    const href = card.getAttribute("href") || "";
    const queryStartIndex = href.indexOf("?");
    if (queryStartIndex === -1) {
        return 0;
    }
    const params = new URLSearchParams(href.slice(queryStartIndex + 1));
    const createdAt = params.get("createdAt") || "";
    const timestamp = new Date(createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
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
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
//# sourceMappingURL=dashboard.js.map
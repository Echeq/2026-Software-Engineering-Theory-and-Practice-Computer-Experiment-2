"use strict";
var TasksPage;
(function (TasksPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const DB_NAME = "SPMP_DB";
    const DB_VERSION = 1;
    const TASKS_STORE_NAME = "tasks";
    const SELECTED_PROJECT_STORAGE_KEY = "selectedProjectContext";
    const KNOWN_PROJECTS_STORAGE_KEY = "knownProjectsList";
    const EMPTY_PROJECT_ID = "__no-project__";
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    const TASK_COLUMNS = [
        { id: "Todo", title: "Todo", caption: "Planned work that still needs to start.", className: "task-column-todo" },
        { id: "In Progress", title: "In Progress", caption: "Tasks actively being worked on right now.", className: "task-column-progress" },
        { id: "Done", title: "Done", caption: "Completed tasks ready for review or reference.", className: "task-column-done" }
    ];
    let db = null;
    let currentUser = null;
    let userNameElement = null;
    let userAvatarElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    let selectedProjectNameElement = null;
    let selectedProjectMetaElement = null;
    let tasksPageSubtitleElement = null;
    let openTaskModalButton = null;
    let taskModalElement = null;
    let closeTaskModalButton = null;
    let cancelTaskModalButton = null;
    let taskFormElement = null;
    let taskFormMessageElement = null;
    let tasksMessageElement = null;
    let tasksBoardElement = null;
    let taskTitleInput = null;
    let taskDescriptionInput = null;
    let taskStatusSelect = null;
    let taskPrioritySelect = null;
    let taskDueDateInput = null;
    let taskProjectSelect = null;
    let selectedProjectContext = null;
    let knownProjects = [];
    document.addEventListener("DOMContentLoaded", () => {
        void initializeTasksPage();
    });
    async function initializeTasksPage() {
        cacheElements();
        initializeTheme();
        syncSidebarState();
        setupEventListeners();
        hydrateProjectContext();
        renderSelectedProjectContext();
        renderProjectOptions();
        renderBoardLoading();
        try {
            db = await openDatabase();
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error opening IndexedDB:", error);
            renderBoardError("Failed to open local task storage. Please refresh the page.");
        }
        const token = getStoredToken();
        if (!token) {
            loadPreviewUser();
            return;
        }
        await loadUserData();
    }
    function cacheElements() {
        userNameElement = document.getElementById("user-name");
        userAvatarElement = document.getElementById("user-avatar");
        logoutButton = document.getElementById("logout-btn");
        themeToggleButton = document.getElementById("theme-toggle-btn");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
        selectedProjectNameElement = document.getElementById("selected-project-name");
        selectedProjectMetaElement = document.getElementById("selected-project-meta");
        tasksPageSubtitleElement = document.getElementById("tasks-page-subtitle");
        openTaskModalButton = document.getElementById("open-task-modal-btn");
        taskModalElement = document.getElementById("task-modal");
        closeTaskModalButton = document.getElementById("close-task-modal");
        cancelTaskModalButton = document.getElementById("cancel-task-modal");
        taskFormElement = document.getElementById("task-form");
        taskFormMessageElement = document.getElementById("task-form-message");
        tasksMessageElement = document.getElementById("tasks-message");
        tasksBoardElement = document.getElementById("tasks-board");
        taskTitleInput = document.getElementById("task-title");
        taskDescriptionInput = document.getElementById("task-description");
        taskStatusSelect = document.getElementById("task-status");
        taskPrioritySelect = document.getElementById("task-priority");
        taskDueDateInput = document.getElementById("task-due-date");
        taskProjectSelect = document.getElementById("task-project");
    }
    function setupEventListeners() {
        logoutButton?.addEventListener("click", logout);
        themeToggleButton?.addEventListener("click", toggleTheme);
        sidebarToggleButton?.addEventListener("click", toggleSidebar);
        sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
        openTaskModalButton?.addEventListener("click", openTaskModal);
        closeTaskModalButton?.addEventListener("click", closeTaskModal);
        cancelTaskModalButton?.addEventListener("click", closeTaskModal);
        taskModalElement?.addEventListener("click", handleTaskModalClick);
        taskFormElement?.addEventListener("submit", handleTaskFormSubmit);
        tasksBoardElement?.addEventListener("click", handleBoardClick);
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
        if (event.key === "Escape" && taskModalElement && !taskModalElement.hidden) {
            closeTaskModal();
            return;
        }
        if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
            closeSidebar();
        }
    }
    function hydrateProjectContext() {
        const searchParams = new URLSearchParams(window.location.search);
        const queryProjectId = searchParams.get("projectId")?.trim() || "";
        const queryProjectName = searchParams.get("projectName")?.trim() || "";
        const queryStatus = searchParams.get("status")?.trim() || "";
        const queryCreator = searchParams.get("creator")?.trim() || "";
        const queryCreatedAt = searchParams.get("createdAt")?.trim() || "";
        knownProjects = readKnownProjects();
        const storedContext = readSelectedProjectContext();
        if (queryProjectId || queryProjectName) {
            selectedProjectContext = {
                projectId: queryProjectId,
                projectName: queryProjectName || "Selected Project",
                status: queryStatus,
                creator: queryCreator,
                createdAt: queryCreatedAt
            };
            persistSelectedProjectContext(selectedProjectContext);
            registerKnownProject(selectedProjectContext);
        }
        else if (storedContext) {
            selectedProjectContext = storedContext;
            registerKnownProject(storedContext);
        }
        else {
            selectedProjectContext = null;
        }
        knownProjects = readKnownProjects();
    }
    function readSelectedProjectContext() {
        const raw = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (parsed &&
                typeof parsed.projectId === "string" &&
                typeof parsed.projectName === "string" &&
                typeof parsed.status === "string" &&
                typeof parsed.creator === "string" &&
                typeof parsed.createdAt === "string") {
                return parsed;
            }
        }
        catch (error) {
            console.warn("Failed to parse selected project context:", error);
        }
        return null;
    }
    function persistSelectedProjectContext(context) {
        localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(context));
    }
    function readKnownProjects() {
        const raw = localStorage.getItem(KNOWN_PROJECTS_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed
                .filter((item) => item &&
                typeof item.projectId === "string" &&
                typeof item.projectName === "string")
                .map((item) => ({
                projectId: item.projectId,
                projectName: item.projectName,
                status: typeof item.status === "string" ? item.status : "",
                creator: typeof item.creator === "string" ? item.creator : "",
                createdAt: typeof item.createdAt === "string" ? item.createdAt : ""
            }));
        }
        catch (error) {
            console.warn("Failed to parse known projects:", error);
            return [];
        }
    }
    function persistKnownProjects(projects) {
        localStorage.setItem(KNOWN_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }
    function registerKnownProject(context) {
        if (!context.projectId && !context.projectName) {
            return;
        }
        const existingProjects = readKnownProjects();
        const nextProjects = existingProjects.filter((project) => project.projectId !== context.projectId);
        nextProjects.unshift({
            projectId: context.projectId,
            projectName: context.projectName,
            status: context.status,
            creator: context.creator,
            createdAt: context.createdAt
        });
        persistKnownProjects(nextProjects.slice(0, 24));
    }
    function renderSelectedProjectContext() {
        const projectName = selectedProjectContext?.projectName?.trim() || i18n("tasks.noProject");
        const status = selectedProjectContext?.status?.trim() || "No status";
        const creator = selectedProjectContext?.creator?.trim() || i18n("common.unavailable");
        const createdAt = formatProjectDate(selectedProjectContext?.createdAt?.trim() || "");
        if (selectedProjectNameElement) {
            selectedProjectNameElement.textContent = projectName;
        }
        if (selectedProjectMetaElement) {
            if (selectedProjectContext) {
                selectedProjectMetaElement.textContent = `${status} • ${creator} • ${createdAt}`;
            }
            else {
                selectedProjectMetaElement.textContent = "No project context saved yet. Open a project card from Projects or choose one in the form.";
            }
        }
        if (tasksPageSubtitleElement) {
            tasksPageSubtitleElement.textContent = selectedProjectContext
                ? `Local task workflow for ${projectName}.`
                : "Create tasks locally and optionally attach them to a selected project.";
        }
    }
    function renderProjectOptions() {
        if (!taskProjectSelect) {
            return;
        }
        const selectedProjectId = selectedProjectContext?.projectId || "";
        const options = [];
        options.push(`<option value="${EMPTY_PROJECT_ID}">No project</option>`);
        knownProjects.forEach((project) => {
            const isSelected = project.projectId === selectedProjectId;
            options.push(`<option value="${escapeHtml(project.projectId)}"${isSelected ? " selected" : ""}>${escapeHtml(project.projectName)}</option>`);
        });
        taskProjectSelect.innerHTML = options.join("");
        if (!selectedProjectId) {
            taskProjectSelect.value = EMPTY_PROJECT_ID;
        }
    }
    function renderBoardLoading() {
        if (!tasksBoardElement) {
            return;
        }
        tasksBoardElement.innerHTML = `
      <article class="state-card">
        <h3>Loading tasks...</h3>
        <p>Opening the local IndexedDB task store.</p>
      </article>
    `;
    }
    function renderBoardError(text) {
        if (!tasksBoardElement) {
            return;
        }
        tasksBoardElement.innerHTML = `
      <article class="state-card">
        <h3>Tasks unavailable</h3>
        <p>${escapeHtml(text)}</p>
      </article>
    `;
    }
    async function handleTaskFormSubmit(event) {
        event.preventDefault();
        clearTaskFormMessage();
        const title = taskTitleInput?.value.trim() || "";
        if (!title) {
            showTaskFormMessage("Title is required.", "error");
            taskTitleInput?.focus();
            return;
        }
        const dueDate = taskDueDateInput?.value.trim() || "";
        if (dueDate && !isIsoDateValue(dueDate)) {
            showTaskFormMessage("Use the due date format YYYY-MM-DD.", "error");
            taskDueDateInput?.focus();
            return;
        }
        const projectIdValue = taskProjectSelect?.value || EMPTY_PROJECT_ID;
        const projectId = projectIdValue === EMPTY_PROJECT_ID ? "" : projectIdValue;
        const task = {
            projectId,
            title,
            description: taskDescriptionInput?.value.trim() || "",
            status: normalizeStatus(taskStatusSelect?.value || "Todo"),
            priority: normalizePriority(taskPrioritySelect?.value || "Medium"),
            createdAt: new Date().toISOString(),
            dueDate
        };
        try {
            await addTask(task);
            closeTaskModal();
            showTasksMessage("Task saved locally.", "success");
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error saving task:", error);
            showTaskFormMessage("Failed to save task locally. Please try again.", "error");
        }
    }
    function handleBoardClick(event) {
        const target = event.target;
        const deleteButton = target?.closest("[data-delete-task-id]");
        if (!deleteButton) {
            return;
        }
        const taskId = Number(deleteButton.getAttribute("data-delete-task-id"));
        if (!Number.isFinite(taskId)) {
            return;
        }
        void deleteTaskAndRefresh(taskId);
    }
    async function deleteTaskAndRefresh(taskId) {
        try {
            await deleteTask(taskId);
            showTasksMessage("Task deleted locally.", "success");
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error deleting task:", error);
            showTasksMessage("Failed to delete task locally. Please try again.", "error");
        }
    }
    function openTaskModal() {
        if (!taskModalElement) {
            return;
        }
        clearTaskFormMessage();
        closeSidebar();
        resetTaskForm();
        renderProjectOptions();
        taskModalElement.hidden = false;
        taskModalElement.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        taskTitleInput?.focus();
    }
    function closeTaskModal() {
        if (!taskModalElement) {
            return;
        }
        taskModalElement.hidden = true;
        taskModalElement.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        clearTaskFormMessage();
        taskFormElement?.reset();
        if (taskProjectSelect) {
            taskProjectSelect.value = selectedProjectContext?.projectId || EMPTY_PROJECT_ID;
        }
        if (taskStatusSelect) {
            taskStatusSelect.value = "Todo";
        }
        if (taskPrioritySelect) {
            taskPrioritySelect.value = "Medium";
        }
    }
    function handleTaskModalClick(event) {
        const target = event.target;
        if (target?.dataset.closeModal === "true") {
            closeTaskModal();
        }
    }
    function resetTaskForm() {
        taskFormElement?.reset();
        if (taskStatusSelect) {
            taskStatusSelect.value = "Todo";
        }
        if (taskPrioritySelect) {
            taskPrioritySelect.value = "Medium";
        }
        if (taskProjectSelect) {
            taskProjectSelect.value = selectedProjectContext?.projectId || EMPTY_PROJECT_ID;
        }
    }
    function showTaskFormMessage(text, type = "") {
        if (!taskFormMessageElement) {
            return;
        }
        taskFormMessageElement.textContent = text;
        taskFormMessageElement.className = type ? `form-message ${type}` : "form-message";
    }
    function clearTaskFormMessage() {
        showTaskFormMessage("");
    }
    function showTasksMessage(text, type = "") {
        if (!tasksMessageElement) {
            return;
        }
        tasksMessageElement.textContent = text;
        tasksMessageElement.className = type ? `form-message ${type}` : "form-message";
    }
    async function openDatabase() {
        return await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => {
                reject(request.error || new Error("Failed to open IndexedDB."));
            };
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(TASKS_STORE_NAME)) {
                    const store = database.createObjectStore(TASKS_STORE_NAME, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                    store.createIndex("status", "status", { unique: false });
                    store.createIndex("projectId", "projectId", { unique: false });
                    store.createIndex("createdAt", "createdAt", { unique: false });
                }
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }
    async function addTask(task) {
        const database = ensureDatabase();
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(TASKS_STORE_NAME, "readwrite");
            const store = transaction.objectStore(TASKS_STORE_NAME);
            const request = store.add(task);
            request.onerror = () => {
                reject(request.error || new Error("Failed to add task."));
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    async function getAllTasks() {
        const database = ensureDatabase();
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(TASKS_STORE_NAME, "readonly");
            const store = transaction.objectStore(TASKS_STORE_NAME);
            const request = store.getAll();
            request.onerror = () => {
                reject(request.error || new Error("Failed to read tasks."));
            };
            request.onsuccess = () => {
                const tasks = Array.isArray(request.result) ? request.result : [];
                resolve(tasks.map((task) => ({
                    id: Number(task.id),
                    projectId: typeof task.projectId === "string" ? task.projectId : "",
                    title: typeof task.title === "string" ? task.title : "",
                    description: typeof task.description === "string" ? task.description : "",
                    status: normalizeStatus(typeof task.status === "string" ? task.status : "Todo"),
                    priority: normalizePriority(typeof task.priority === "string" ? task.priority : "Medium"),
                    createdAt: typeof task.createdAt === "string" ? task.createdAt : "",
                    dueDate: typeof task.dueDate === "string" ? task.dueDate : ""
                })));
            };
        });
    }
    async function deleteTask(taskId) {
        const database = ensureDatabase();
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(TASKS_STORE_NAME, "readwrite");
            const store = transaction.objectStore(TASKS_STORE_NAME);
            const request = store.delete(taskId);
            request.onerror = () => {
                reject(request.error || new Error("Failed to delete task."));
            };
            request.onsuccess = () => {
                resolve();
            };
        });
    }
    function ensureDatabase() {
        if (!db) {
            throw new Error("Database is not initialized.");
        }
        return db;
    }
    async function loadAndRenderTasks() {
        const tasks = await getAllTasks();
        renderTasksBoard(tasks);
    }
    function renderTasksBoard(tasks) {
        if (!tasksBoardElement) {
            return;
        }
        const groupedTasks = {
            Todo: [],
            "In Progress": [],
            Done: []
        };
        tasks
            .sort((left, right) => {
            const leftTime = new Date(left.createdAt).getTime();
            const rightTime = new Date(right.createdAt).getTime();
            return rightTime - leftTime;
        })
            .forEach((task) => {
            groupedTasks[normalizeStatus(task.status)].push(task);
        });
        tasksBoardElement.innerHTML = TASK_COLUMNS.map((column) => renderTaskColumn(column, groupedTasks[column.id])).join("");
    }
    function renderTaskColumn(column, tasks) {
        const cardsMarkup = tasks.length > 0
            ? tasks.map((task) => renderTaskCard(task)).join("")
            : `
          <article class="state-card task-empty-state">
            <h3>No tasks yet</h3>
            <p>Add a task to start filling this ${escapeHtml(column.title.toLowerCase())} column.</p>
          </article>
        `;
        return `
      <section class="kanban-column ${escapeHtml(column.className)}" aria-labelledby="task-column-${escapeHtml(getColumnDomId(column.id))}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="task-column-${escapeHtml(getColumnDomId(column.id))}" class="kanban-column-title">${escapeHtml(column.title)}</h3>
            <p class="kanban-column-caption">${escapeHtml(column.caption)}</p>
          </div>
          <span class="kanban-count" aria-label="${tasks.length} tasks">${tasks.length}</span>
        </header>
        <div class="kanban-list">
          ${cardsMarkup}
        </div>
      </section>
    `;
    }
    function renderTaskCard(task) {
        const projectName = getProjectNameById(task.projectId);
        const priorityClass = `priority-${task.priority.toLowerCase().replace(/\s+/g, "-")}`;
        const descriptionMarkup = task.description
            ? `<p class="task-card-description">${escapeHtml(task.description)}</p>`
            : '<p class="task-card-description is-empty">No description provided.</p>';
        const dueDateLabel = task.dueDate ? formatDueDate(task.dueDate) : "No due date";
        const projectLabel = projectName || "No project";
        return `
      <article class="project-card task-card" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-card-title-wrap">
            <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
            <span class="task-priority-badge ${escapeHtml(priorityClass)}">${escapeHtml(task.priority)}</span>
          </div>
          <button type="button" class="danger-button task-delete-button" data-delete-task-id="${task.id}">Delete</button>
        </div>
        ${descriptionMarkup}
        <div class="task-meta-list">
          <span class="task-meta-item"><strong>Project:</strong> ${escapeHtml(projectLabel)}</span>
          <span class="task-meta-item"><strong>Due:</strong> ${escapeHtml(dueDateLabel)}</span>
        </div>
      </article>
    `;
    }
    function getProjectNameById(projectId) {
        if (!projectId) {
            return "";
        }
        const project = knownProjects.find((item) => item.projectId === projectId);
        if (project?.projectName) {
            return project.projectName;
        }
        if (selectedProjectContext?.projectId === projectId) {
            return selectedProjectContext.projectName || "";
        }
        return "";
    }
    function getColumnDomId(columnId) {
        return columnId.toLowerCase().replace(/\s+/g, "-");
    }
    function normalizeStatus(status) {
        const normalized = status.trim().toLowerCase();
        if (normalized === "done") {
            return "Done";
        }
        if (normalized === "in progress" || normalized === "in-progress") {
            return "In Progress";
        }
        return "Todo";
    }
    function normalizePriority(priority) {
        const normalized = priority.trim().toLowerCase();
        if (normalized === "high") {
            return "High";
        }
        if (normalized === "low") {
            return "Low";
        }
        return "Medium";
    }
    function isIsoDateValue(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return false;
        }
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        return !Number.isNaN(date.getTime())
            && date.getFullYear() === year
            && date.getMonth() === month - 1
            && date.getDate() === day;
    }
    function formatDueDate(dateString) {
        if (!isIsoDateValue(dateString)) {
            return "Invalid date";
        }
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }
    function loadPreviewUser() {
        currentUser = {
            id: "preview-user",
            name: "Anna Ivanova",
            email: "anna.ivanova@example.com"
        };
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        updateUserAvatar(currentUser.name);
    }
    async function loadUserData() {
        try {
            const data = await requestWithAuth("/auth/me");
            currentUser = data.user;
            if (userNameElement) {
                userNameElement.textContent = currentUser.name;
            }
            updateUserAvatar(currentUser.name);
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
    function formatProjectDate(dateString) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return i18n("common.createdRecently");
        }
        const locale = window.I18n?.getLanguage() === "zh" ? "zh-CN" : window.I18n?.getLanguage() === "es" ? "es-ES" : "en-US";
        return i18n("common.createdDate", {
            date: date.toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric"
            })
        });
    }
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
})(TasksPage || (TasksPage = {}));
//# sourceMappingURL=tasks.js.map

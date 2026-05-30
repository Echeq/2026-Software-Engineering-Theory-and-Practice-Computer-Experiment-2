"use strict";
var TasksPage;
(function (TasksPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const DB_NAME = "SPMP_DB";
    const DB_VERSION = 1;
    const TASKS_STORE_NAME = "tasks";
    const SELECTED_PROJECT_STORAGE_KEY = "selectedProjectContext";
    const KNOWN_PROJECTS_STORAGE_KEY = "knownProjectsList";
    const EMPTY_PROJECT_ID = "__no-project__";
    const EMPTY_COLUMN_LOTTIE_PATH = "https://assets2.lottiefiles.com/packages/lf20_ysrn2iwp.json";
    const TASK_SORTABLE_GROUP_NAME = "tasks";
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
    const TASK_COLUMNS = [
        { id: "Todo", titleKey: "tasks.status.todo", captionKey: "tasks.column.todoCaption", className: "task-column-todo" },
        { id: "In Progress", titleKey: "tasks.status.inProgress", captionKey: "tasks.column.inProgressCaption", className: "task-column-progress" },
        { id: "Done", titleKey: "tasks.status.done", captionKey: "tasks.column.doneCaption", className: "task-column-done" }
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
    let saveTaskButton = null;
    let taskModalTitleElement = null;
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
    let taskFilterPrioritySelect = null;
    let taskFilterStatusSelect = null;
    let taskSortSelect = null;
    let clearTaskFiltersButton = null;
    let selectedProjectContext = null;
    let knownProjects = [];
    let allTasks = [];
    let hasLoadedTasks = false;
    let editingTaskId = null;
    const taskFilters = {
        priority: "all",
        status: "all",
        sort: "created-desc"
    };
    const emptyColumnAnimations = new Map();
    const taskColumnSortables = [];
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
            renderBoardError(i18n("tasks.storageOpenFailed"));
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
        if (userNameElement) {
            userNameElement.textContent = "";
        }
        selectedProjectNameElement = document.getElementById("selected-project-name");
        selectedProjectMetaElement = document.getElementById("selected-project-meta");
        tasksPageSubtitleElement = document.getElementById("tasks-page-subtitle");
        openTaskModalButton = document.getElementById("open-task-modal-btn");
        taskModalElement = document.getElementById("task-modal");
        closeTaskModalButton = document.getElementById("close-task-modal");
        cancelTaskModalButton = document.getElementById("cancel-task-modal");
        saveTaskButton = document.getElementById("save-task-btn");
        taskModalTitleElement = document.getElementById("task-modal-title");
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
        taskFilterPrioritySelect = document.getElementById("task-filter-priority");
        taskFilterStatusSelect = document.getElementById("task-filter-status");
        taskSortSelect = document.getElementById("task-sort-select");
        clearTaskFiltersButton = document.getElementById("clear-task-filters-btn");
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
        taskFilterPrioritySelect?.addEventListener("change", handleTaskFilterChange);
        taskFilterStatusSelect?.addEventListener("change", handleTaskFilterChange);
        taskSortSelect?.addEventListener("change", handleTaskFilterChange);
        clearTaskFiltersButton?.addEventListener("click", clearTaskFilters);
        window.addEventListener("resize", syncSidebarState);
        document.addEventListener("keydown", handleEscapeKey);
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
        if (event.key === "Escape" && taskModalElement && !taskModalElement.hidden) {
            closeTaskModal();
            return;
        }
        if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
            closeSidebar();
        }
    }
    function handleLanguageChange() {
        renderUserName(currentUser ? "" : i18n("common.unavailable"));
        renderSelectedProjectContext();
        renderProjectOptions();
        renderVisibleTaskSelectLabels();
        syncSidebarState();
        if (taskDueDateInput) {
            taskDueDateInput.lang = getCurrentLocale();
        }
        if (hasLoadedTasks) {
            renderFilteredTasks();
            return;
        }
        renderBoardLoading();
    }
    function hydrateProjectContext() {
        const searchParams = new URLSearchParams(window.location.search);
        const queryProjectId = searchParams.get("projectId")?.trim() || "";
        const queryProjectName = searchParams.get("projectName")?.trim() || "";
        const queryStatus = searchParams.get("status")?.trim() || "";
        const queryStatusKey = searchParams.get("statusKey")?.trim() || "";
        const queryCreator = searchParams.get("creator")?.trim() || "";
        const queryCreatedAt = searchParams.get("createdAt")?.trim() || "";
        knownProjects = readKnownProjects();
        const storedContext = readSelectedProjectContext();
        if (queryProjectId || queryProjectName) {
            selectedProjectContext = {
                projectId: queryProjectId,
                projectName: queryProjectName || i18n("tasks.selectedProject"),
                status: queryStatus,
                statusKey: queryStatusKey,
                creator: getDisplayName(queryCreator || i18n("common.you")),
                createdAt: queryCreatedAt
            };
            persistSelectedProjectContext(selectedProjectContext);
            registerKnownProject(selectedProjectContext);
        }
        else if (storedContext) {
            selectedProjectContext = {
                ...storedContext,
                creator: getDisplayName(storedContext.creator || i18n("common.you"))
            };
            persistSelectedProjectContext(selectedProjectContext);
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
                return {
                    projectId: parsed.projectId,
                    projectName: parsed.projectName,
                    status: parsed.status,
                    statusKey: typeof parsed.statusKey === "string" ? parsed.statusKey : "",
                    creator: parsed.creator,
                    createdAt: parsed.createdAt
                };
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
                statusKey: typeof item.statusKey === "string" ? item.statusKey : "",
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
            statusKey: context.statusKey || "",
            creator: getDisplayName(context.creator || i18n("common.you")),
            createdAt: context.createdAt
        });
        persistKnownProjects(nextProjects.slice(0, 24));
    }
    function renderSelectedProjectContext() {
        const projectName = selectedProjectContext?.projectName?.trim() || i18n("tasks.noProject");
        const status = formatProjectContextStatus(selectedProjectContext?.statusKey || "", selectedProjectContext?.status?.trim() || "") || i18n("tasks.noProjectStatus");
        const creator = getDisplayName(selectedProjectContext?.creator?.trim() || i18n("common.unavailable"));
        const createdAt = formatProjectDate(selectedProjectContext?.createdAt?.trim() || "");
        if (selectedProjectNameElement) {
            selectedProjectNameElement.textContent = projectName;
        }
        if (selectedProjectMetaElement) {
            if (selectedProjectContext) {
                selectedProjectMetaElement.textContent = `${status} • ${creator} • ${createdAt}`;
            }
            else {
                selectedProjectMetaElement.textContent = i18n("tasks.noProjectContextSaved");
            }
        }
        if (tasksPageSubtitleElement) {
            tasksPageSubtitleElement.textContent = selectedProjectContext
                ? i18n("tasks.subtitleLocalProject", { projectName })
                : i18n("tasks.subtitleLocalDefault");
        }
    }
    function renderProjectOptions() {
        if (!taskProjectSelect) {
            return;
        }
        const selectedProjectId = selectedProjectContext?.projectId || "";
        const options = [];
        options.push(`<option value="${EMPTY_PROJECT_ID}">${escapeHtml(i18n("tasks.form.noProjectOption"))}</option>`);
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
        hasLoadedTasks = false;
        destroyTaskBoardSorting();
        destroyEmptyColumnAnimations();
        tasksBoardElement.innerHTML = `
      <article class="state-card">
        <h3>${escapeHtml(i18n("tasks.loadingTitle"))}</h3>
        <p>${escapeHtml(i18n("tasks.loadingText"))}</p>
      </article>
    `;
    }
    function renderBoardError(text) {
        if (!tasksBoardElement) {
            return;
        }
        hasLoadedTasks = false;
        destroyTaskBoardSorting();
        destroyEmptyColumnAnimations();
        tasksBoardElement.innerHTML = `
      <article class="state-card">
        <h3>${escapeHtml(i18n("tasks.unavailableTitle"))}</h3>
        <p>${escapeHtml(text)}</p>
      </article>
    `;
    }
    async function handleTaskFormSubmit(event) {
        event.preventDefault();
        clearTaskFormMessage();
        const title = taskTitleInput?.value.trim() || "";
        if (!title) {
            showTaskFormMessage("", "error", "tasks.validation.titleRequired");
            taskTitleInput?.focus();
            return;
        }
        const dueDate = taskDueDateInput?.value.trim() || "";
        if (dueDate && !isIsoDateValue(dueDate)) {
            showTaskFormMessage("", "error", "tasks.validation.invalidDueDate");
            taskDueDateInput?.focus();
            return;
        }
        const projectIdValue = taskProjectSelect?.value || EMPTY_PROJECT_ID;
        const projectId = projectIdValue === EMPTY_PROJECT_ID ? "" : projectIdValue;
        const isEditing = editingTaskId !== null;
        const existingTask = getEditingTask();
        const task = {
            projectId,
            title,
            description: taskDescriptionInput?.value.trim() || "",
            status: normalizeStatus(taskStatusSelect?.value || "Todo"),
            priority: normalizePriority(taskPrioritySelect?.value || "Medium"),
            createdAt: existingTask?.createdAt || new Date().toISOString(),
            dueDate
        };
        try {
            if (isEditing) {
                await updateTask(editingTaskId, task);
            }
            else {
                await addTask(task);
            }
            closeTaskModal();
            showTasksMessage("", "success", isEditing ? "tasks.message.updated" : "tasks.message.saved");
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error saving task:", error);
            showTaskFormMessage("", "error", "tasks.message.saveFailed");
        }
    }
    function handleBoardClick(event) {
        const target = event.target;
        const editButton = target?.closest("[data-edit-task-id]");
        if (editButton) {
            const editTaskId = Number(editButton.getAttribute("data-edit-task-id"));
            if (Number.isFinite(editTaskId)) {
                openTaskModal(editTaskId);
            }
            return;
        }
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
            showTasksMessage("", "success", "tasks.message.deleted");
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error deleting task:", error);
            showTasksMessage("", "error", "tasks.message.deleteFailed");
        }
    }
    function openTaskModal(taskId) {
        if (!taskModalElement) {
            return;
        }
        clearTaskFormMessage();
        closeSidebar();
        resetTaskForm();
        renderProjectOptions();
        if (Number.isFinite(taskId)) {
            editingTaskId = Number(taskId);
            populateTaskFormForEditing(editingTaskId);
        }
        updateTaskModalCopy();
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
        resetTaskForm();
    }
    function handleTaskModalClick(event) {
        const target = event.target;
        if (target?.dataset.closeModal === "true") {
            closeTaskModal();
        }
    }
    function resetTaskForm() {
        taskFormElement?.reset();
        editingTaskId = null;
        if (taskStatusSelect) {
            taskStatusSelect.value = "Todo";
        }
        if (taskPrioritySelect) {
            taskPrioritySelect.value = "Medium";
        }
        if (taskProjectSelect) {
            taskProjectSelect.value = selectedProjectContext?.projectId || EMPTY_PROJECT_ID;
        }
        updateTaskModalCopy();
    }
function showTaskFormMessage(text, type = "", key = "", values) {
        if (!taskFormMessageElement) {
            return;
        }
        if (key) {
            setDynamicText(taskFormMessageElement, key, values);
        }
        else {
            clearDynamicText(taskFormMessageElement);
            taskFormMessageElement.textContent = text;
        }
        taskFormMessageElement.className = type ? `form-message ${type}` : "form-message";
    }
    function clearTaskFormMessage() {
        showTaskFormMessage("");
    }
function showTasksMessage(text, type = "", key = "", values) {
        if (!tasksMessageElement) {
            return;
        }
        if (key) {
            setDynamicText(tasksMessageElement, key, values);
        }
        else {
            clearDynamicText(tasksMessageElement);
            tasksMessageElement.textContent = text;
        }
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
    async function updateTask(taskId, task) {
        const database = ensureDatabase();
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(TASKS_STORE_NAME, "readwrite");
            const store = transaction.objectStore(TASKS_STORE_NAME);
            const getRequest = store.get(taskId);
            getRequest.onerror = () => {
                reject(getRequest.error || new Error("Failed to read task for update."));
            };
            getRequest.onsuccess = () => {
                const existingTask = getRequest.result;
                if (!existingTask || typeof existingTask !== "object") {
                    reject(new Error("Task not found for update."));
                    return;
                }
                const putRequest = store.put({
                    ...existingTask,
                    ...task,
                    id: taskId,
                    createdAt: task.createdAt || existingTask.createdAt || new Date().toISOString()
                });
                putRequest.onerror = () => {
                    reject(putRequest.error || new Error("Failed to update task."));
                };
                putRequest.onsuccess = () => {
                    resolve();
                };
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
    async function updateTaskStatus(taskId, status) {
        const database = ensureDatabase();
        const normalizedStatus = normalizeStatus(status);
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(TASKS_STORE_NAME, "readwrite");
            const store = transaction.objectStore(TASKS_STORE_NAME);
            const getRequest = store.get(taskId);
            getRequest.onerror = () => {
                reject(getRequest.error || new Error("Failed to read task for status update."));
            };
            getRequest.onsuccess = () => {
                const existingTask = getRequest.result;
                if (!existingTask || typeof existingTask !== "object") {
                    reject(new Error("Task not found for status update."));
                    return;
                }
                const nextTask = {
                    ...existingTask,
                    status: normalizedStatus
                };
                const putRequest = store.put(nextTask);
                putRequest.onerror = () => {
                    reject(putRequest.error || new Error("Failed to update task status."));
                };
                putRequest.onsuccess = () => {
                    resolve();
                };
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
        allTasks = await getAllTasks();
        hasLoadedTasks = true;
        renderFilteredTasks();
    }
    function renderFilteredTasks() {
        const visibleTasks = sortTasks(getFilteredTasks(allTasks));
        renderTasksBoard(visibleTasks);
        refreshVisibleProjectCompletionCards(visibleTasks);
    }
    function getFilteredTasks(tasks) {
        return tasks.filter((task) => matchesTaskFilters(task));
    }
    function matchesTaskFilters(task) {
        const matchesPriority = taskFilters.priority === "all" || normalizePriority(task.priority) === taskFilters.priority;
        const matchesStatus = taskFilters.status === "all" || normalizeStatus(task.status) === taskFilters.status;
        return matchesPriority && matchesStatus;
    }
    function handleTaskFilterChange() {
        taskFilters.priority = taskFilterPrioritySelect?.value || "all";
        taskFilters.status = taskFilterStatusSelect?.value || "all";
        taskFilters.sort = taskSortSelect?.value || "created-desc";
        renderFilteredTasks();
    }
    function clearTaskFilters() {
        taskFilters.priority = "all";
        taskFilters.status = "all";
        taskFilters.sort = "created-desc";
        if (taskFilterPrioritySelect) {
            taskFilterPrioritySelect.value = "all";
        }
        if (taskFilterStatusSelect) {
            taskFilterStatusSelect.value = "all";
        }
        if (taskSortSelect) {
            taskSortSelect.value = "created-desc";
        }
        renderFilteredTasks();
    }
    function sortTasks(tasks) {
        const sort = taskFilters.sort;
        const priorityRank = {
            High: 3,
            Medium: 2,
            Low: 1
        };
        return [...tasks].sort((left, right) => {
            if (sort === "created-asc" || sort === "created-desc") {
                const leftTime = new Date(left.createdAt).getTime();
                const rightTime = new Date(right.createdAt).getTime();
                const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;
                const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;
                return sort === "created-asc" ? safeLeftTime - safeRightTime : safeRightTime - safeLeftTime;
            }
            if (sort === "due-asc" || sort === "due-desc") {
                const leftTime = readSortableDueDate(left.dueDate);
                const rightTime = readSortableDueDate(right.dueDate);
                return sort === "due-asc" ? leftTime - rightTime : rightTime - leftTime;
            }
            if (sort === "priority-desc") {
                const leftPriority = priorityRank[normalizePriority(left.priority)] || 0;
                const rightPriority = priorityRank[normalizePriority(right.priority)] || 0;
                if (rightPriority !== leftPriority) {
                    return rightPriority - leftPriority;
                }
                const leftTime = new Date(left.createdAt).getTime();
                const rightTime = new Date(right.createdAt).getTime();
                return rightTime - leftTime;
            }
            return 0;
        });
    }
    function readSortableDueDate(dateString) {
        if (!isIsoDateValue(dateString)) {
            return Number.MAX_SAFE_INTEGER;
        }
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day).getTime();
    }
    function renderTasksBoard(tasks) {
        if (!tasksBoardElement) {
            return;
        }
        destroyTaskBoardSorting();
        destroyEmptyColumnAnimations();
        const groupedTasks = {
            Todo: [],
            "In Progress": [],
            Done: []
        };
        tasks.forEach((task) => {
            groupedTasks[normalizeStatus(task.status)].push(task);
        });
        tasksBoardElement.innerHTML = TASK_COLUMNS.map((column) => renderTaskColumn(column, groupedTasks[column.id])).join("");
        initializeEmptyColumnAnimations();
        initializeTaskBoardSorting();
        updateTaskCountBadges();
    }
    function renderTaskColumn(column, tasks) {
        const cardsMarkup = tasks.length > 0
            ? tasks.map((task) => renderTaskCard(task)).join("")
            : renderEmptyTaskState(column);
        return `
      <section class="kanban-column ${escapeHtml(column.className)}" aria-labelledby="task-column-${escapeHtml(getColumnDomId(column.id))}" data-column-status="${escapeHtml(column.id)}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="task-column-${escapeHtml(getColumnDomId(column.id))}" class="kanban-column-title">${escapeHtml(i18n(column.titleKey))}</h3>
            <p class="kanban-column-caption">${escapeHtml(i18n(column.captionKey))}</p>
          </div>
          <span class="kanban-count" aria-label="${escapeHtml(i18n("common.tasksCount", { count: tasks.length }))}">${tasks.length}</span>
        </header>
        <div class="kanban-list" data-column-status="${escapeHtml(column.id)}">
          ${cardsMarkup}
        </div>
      </section>
    `;
    }
    function renderEmptyTaskState(column) {
        const lottieId = getEmptyColumnLottieId(column.id);
        return `
          <article class="state-card task-empty-state">
            <div class="task-empty-lottie-shell" aria-hidden="true">
              <div id="${escapeHtml(lottieId)}" class="task-empty-lottie"></div>
            </div>
            <p>${escapeHtml(i18n("tasks.emptyColumnText", { column: i18n(column.titleKey).toLowerCase() }))}</p>
          </article>
        `;
    }
    function initializeEmptyColumnAnimations() {
        const lottieApi = window.lottie;
        if (!lottieApi || typeof lottieApi.loadAnimation !== "function") {
            return;
        }
        TASK_COLUMNS.forEach((column) => {
            const container = document.getElementById(getEmptyColumnLottieId(column.id));
            if (!container) {
                return;
            }
            const animation = lottieApi.loadAnimation({
                container,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: EMPTY_COLUMN_LOTTIE_PATH
            });
            emptyColumnAnimations.set(column.id, animation);
        });
    }
    function destroyEmptyColumnAnimations() {
        emptyColumnAnimations.forEach((animation) => {
            if (animation && typeof animation.destroy === "function") {
                animation.destroy();
            }
        });
        emptyColumnAnimations.clear();
    }
    function initializeTaskBoardSorting() {
        if (!tasksBoardElement || !window.Sortable || typeof window.Sortable.create !== "function") {
            return;
        }
        tasksBoardElement.querySelectorAll(".kanban-list").forEach((listElement) => {
            const sortable = window.Sortable.create(listElement, {
                group: TASK_SORTABLE_GROUP_NAME,
                draggable: ".task-card",
                filter: ".task-delete-button, [data-delete-task-id]",
                preventOnFilter: false,
                animation: 180,
                sort: false,
                emptyInsertThreshold: 28,
                dragClass: "task-card-sortable-drag",
                chosenClass: "task-card-sortable-chosen",
                ghostClass: "task-card-sortable-ghost",
                onStart: handleTaskDragStart,
                onEnd: (event) => {
                    void handleTaskDragEnd(event);
                }
            });
            taskColumnSortables.push(sortable);
        });
    }
    function destroyTaskBoardSorting() {
        while (taskColumnSortables.length > 0) {
            const sortable = taskColumnSortables.pop();
            if (sortable && typeof sortable.destroy === "function") {
                sortable.destroy();
            }
        }
    }
    function handleTaskDragStart() {
        toggleEmptyTaskStates(true);
    }
    async function handleTaskDragEnd(event) {
        updateTaskCountBadges();
        const item = event?.item;
        const taskId = Number(item?.getAttribute("data-task-id"));
        const previousStatus = readColumnStatusFromList(event?.from);
        const nextStatus = readColumnStatusFromList(event?.to);
        if (!Number.isFinite(taskId) || !previousStatus || !nextStatus) {
            toggleEmptyTaskStates(false);
            return;
        }
        if (previousStatus === nextStatus) {
            toggleEmptyTaskStates(false);
            updateTaskCountBadges();
            return;
        }
        try {
            await updateTaskStatus(taskId, nextStatus);
            await loadAndRenderTasks();
        }
        catch (error) {
            console.error("Error updating task status:", error);
            showTasksMessage("", "error", "tasks.message.statusUpdateFailed");
            await loadAndRenderTasks();
        }
    }
    function toggleEmptyTaskStates(isHidden) {
        tasksBoardElement?.querySelectorAll(".task-empty-state").forEach((card) => {
            card.hidden = isHidden;
        });
    }
    function readColumnStatusFromList(listElement) {
        const status = listElement?.dataset.columnStatus?.trim() || "";
        return status ? normalizeStatus(status) : "";
    }
    function updateTaskCountBadges() {
        tasksBoardElement?.querySelectorAll(".kanban-column").forEach((columnElement) => {
            const count = columnElement.querySelectorAll(".task-card").length;
            const countBadge = columnElement.querySelector(".kanban-count");
            if (!countBadge) {
                return;
            }
            countBadge.textContent = String(count);
            countBadge.setAttribute("aria-label", i18n("common.tasksCount", { count }));
        });
    }
    function renderTaskCard(task) {
        const projectName = getProjectNameById(task.projectId);
        const priorityClass = `priority-${task.priority.toLowerCase().replace(/\s+/g, "-")}`;
        const descriptionMarkup = task.description
            ? `<p class="task-card-description">${escapeHtml(task.description)}</p>`
            : `<p class="task-card-description is-empty">${escapeHtml(i18n("tasks.card.noDescription"))}</p>`;
        const dueDateDisplay = getDueDateDisplay(task.dueDate);
        const projectLabel = projectName || i18n("tasks.form.noProjectOption");
        const editLabel = getSafeTaskEditLabel();
        return `
      <article class="project-card task-card" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-card-title-wrap">
            <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
            <span class="task-priority-badge ${escapeHtml(priorityClass)}">${escapeHtml(formatPriorityLabel(task.priority))}</span>
          </div>
          <div class="task-card-actions">
            <button type="button" class="task-edit-button" data-edit-task-id="${task.id}">
              <span class="task-edit-button-icon" aria-hidden="true">✏️</span>
              <span>${escapeHtml(editLabel)}</span>
            </button>
            <button type="button" class="danger-button task-delete-button" data-delete-task-id="${task.id}">${escapeHtml(i18n("tasks.card.delete"))}</button>
          </div>
        </div>
        ${descriptionMarkup}
        <div class="task-meta-list">
          <span class="task-meta-item"><strong>${escapeHtml(i18n("tasks.card.projectLabel"))}</strong> ${escapeHtml(projectLabel)}</span>
          <span class="task-meta-item"><strong>${escapeHtml(i18n("tasks.card.dueLabel"))}</strong> <span class="task-due-date ${escapeHtml(dueDateDisplay.className)}">${dueDateDisplay.icon}${escapeHtml(dueDateDisplay.label)}</span></span>
        </div>
      </article>
    `;
    }
    function getDueDateDisplay(dateString) {
        if (!dateString) {
            return {
                label: i18n("tasks.card.noDueDate"),
                className: "",
                icon: ""
            };
        }
        const label = formatDueDate(dateString);
        const urgency = getDueDateUrgency(dateString);
        if (urgency === "overdue") {
            return {
                label,
                className: "is-overdue",
                icon: '<span class="task-due-date-icon" aria-hidden="true">⚠️</span>'
            };
        }
        if (urgency === "warning") {
            return {
                label,
                className: "is-warning",
                icon: '<span class="task-due-date-icon" aria-hidden="true">⚠️</span>'
            };
        }
        return {
            label,
            className: "",
            icon: ""
        };
    }
    function getEditingTask() {
        if (editingTaskId === null) {
            return null;
        }
        return allTasks.find((task) => task.id === editingTaskId) || null;
    }
    function getSafeTaskEditLabel() {
        const translatedLabel = i18n("tasks.card.edit");
        return translatedLabel && translatedLabel !== "tasks.card.edit" ? translatedLabel : "Edit";
    }
    function populateTaskFormForEditing(taskId) {
        const task = allTasks.find((item) => item.id === taskId);
        if (!task) {
            editingTaskId = null;
            updateTaskModalCopy();
            return;
        }
        if (taskTitleInput) {
            taskTitleInput.value = task.title || "";
        }
        if (taskDescriptionInput) {
            taskDescriptionInput.value = task.description || "";
        }
        if (taskStatusSelect) {
            taskStatusSelect.value = normalizeStatus(task.status);
        }
        if (taskPrioritySelect) {
            taskPrioritySelect.value = normalizePriority(task.priority);
        }
        if (taskDueDateInput) {
            taskDueDateInput.value = task.dueDate || "";
        }
        if (taskProjectSelect) {
            taskProjectSelect.value = task.projectId || EMPTY_PROJECT_ID;
        }
    }
    function updateTaskModalCopy() {
        const isEditing = editingTaskId !== null;
        if (taskModalTitleElement) {
            taskModalTitleElement.textContent = i18n(isEditing ? "tasks.editTask" : "tasks.addTask");
        }
        if (saveTaskButton) {
            saveTaskButton.textContent = i18n(isEditing ? "tasks.saveEdit" : "tasks.saveTask");
        }
    }
    function getDueDateUrgency(dateString) {
        if (!isIsoDateValue(dateString)) {
            return "";
        }
        const [year, month, day] = dateString.split("-").map(Number);
        const dueDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const diffInDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
        if (diffInDays < 0) {
            return "overdue";
        }
        if (diffInDays <= 2) {
            return "warning";
        }
        return "";
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
    function getEmptyColumnLottieId(columnId) {
        if (columnId === "In Progress") {
            return "lottie-inprogress";
        }
        return `lottie-${columnId.toLowerCase()}`;
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
    function formatProjectContextStatus(statusKey, status) {
        if (statusKey) {
            return i18n(statusKey);
        }
        const normalizedStatusKey = getLegacyProjectContextStatusKey(status);
        return normalizedStatusKey ? i18n(normalizedStatusKey) : status || "";
    }
    function getLegacyProjectContextStatusKey(status) {
        const normalized = (status || "").trim().toLowerCase();
        if (!normalized) {
            return "";
        }
        if (["planning", "规划中", "planificación"].includes(normalized)) {
            return "status.planning";
        }
        if (["active", "activo"].includes(normalized)) {
            return "status.active";
        }
        if (["in review", "in-review", "评审中", "en revisión"].includes(normalized)) {
            return "status.inReview";
        }
        if (["done", "已完成", "hecho"].includes(normalized)) {
            return "status.done";
        }
        if (["start next", "start-next", "接下来开始", "empezar después"].includes(normalized)) {
            return "projects.startNext";
        }
        if (["in progress", "in-progress", "进行中", "en progreso"].includes(normalized)) {
            return "projects.inProgress";
        }
        return "";
    }
    function formatPriorityLabel(priority) {
        const normalizedPriority = normalizePriority(priority || "");
        if (normalizedPriority === "High") {
            return i18n("tasks.priority.high");
        }
        if (normalizedPriority === "Low") {
            return i18n("tasks.priority.low");
        }
        return i18n("tasks.priority.medium");
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
    function renderVisibleTaskSelectLabels() {
        if (taskStatusSelect) {
            Array.from(taskStatusSelect.options).forEach((option) => {
                option.textContent = option.value === "Done"
                    ? i18n("tasks.status.done")
                    : option.value === "In Progress"
                        ? i18n("tasks.status.inProgress")
                        : i18n("tasks.status.todo");
            });
        }
        if (taskPrioritySelect) {
            Array.from(taskPrioritySelect.options).forEach((option) => {
                option.textContent = option.value === "High"
                    ? i18n("tasks.priority.high")
                    : option.value === "Low"
                        ? i18n("tasks.priority.low")
                        : i18n("tasks.priority.medium");
            });
        }
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
            return i18n("tasks.card.invalidDate");
        }
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString(getCurrentLocale(), {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }
    function refreshVisibleProjectCompletionCards(tasks) {
        const projectCards = Array.from(document.querySelectorAll(".project-card-link[data-project-id]"));
        if (projectCards.length === 0) {
            return;
        }
        const totalByProjectId = new Map();
        const completedByProjectId = new Map();
        tasks.forEach((task) => {
            const projectId = getProjectIdKey(task?.projectId);
            if (!projectId) {
                return;
            }
            totalByProjectId.set(projectId, (totalByProjectId.get(projectId) || 0) + 1);
            if (isCompletedTaskStatus(task?.status)) {
                completedByProjectId.set(projectId, (completedByProjectId.get(projectId) || 0) + 1);
            }
        });
        projectCards.forEach((card) => {
            const projectId = getProjectIdKey(card.getAttribute("data-project-id") || "");
            if (!projectId) {
                return;
            }
            applyProjectCompletionSummaryToCard(card, createProjectCompletionSummary(totalByProjectId.get(projectId) || 0, completedByProjectId.get(projectId) || 0));
        });
    }
    function applyProjectCompletionSummaryToCard(card, summary) {
        const progressRow = card.querySelector(".project-progress-row");
        const progressTrack = card.querySelector(".project-progress-track");
        const progressFill = card.querySelector(".project-progress-fill");
        const progressText = card.querySelector(".project-progress-text");
        if (progressRow) {
            progressRow.className = `project-progress-row project-progress-tone-${summary.tone}`;
        }
        if (progressTrack) {
            progressTrack.setAttribute("aria-valuenow", String(summary.percentage));
            progressTrack.setAttribute("aria-label", summary.label);
        }
        if (progressFill) {
            progressFill.style.width = `${summary.percentage}%`;
        }
        if (progressText) {
            progressText.textContent = summary.label;
        }
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
            label: formatProjectCompletionLabel(percentage)
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
    function isCompletedTaskStatus(status) {
        return typeof status === "string" && status.trim().toLowerCase() === "done";
    }
    function getProjectIdKey(projectId) {
        if (projectId === null || projectId === undefined) {
            return "";
        }
        return String(projectId).trim();
    }
    function loadPreviewUser() {
        currentUser = {
            id: "preview-user",
            name: "Anna Ivanova",
            email: "anna.ivanova@example.com"
        };
        renderUserName();
        updateUserAvatar(currentUser.name);
    }
    async function loadUserData() {
        try {
            const data = await requestWithAuth("/auth/me");
            currentUser = data.user;
            renderUserName();
            updateUserAvatar(currentUser.name);
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
        const name = getDisplayName(fallback);
        userNameElement.textContent = name;
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

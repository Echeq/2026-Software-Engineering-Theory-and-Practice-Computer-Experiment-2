"use strict";
var TasksPage;
(function (TasksPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    let currentUser = null;
    let userNameElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    let selectedProjectNameElement = null;
    let selectedProjectMetaElement = null;
    let tasksPageSubtitleElement = null;
    document.addEventListener("DOMContentLoaded", () => {
        void initializeTasksPage();
    });
    async function initializeTasksPage() {
        cacheElements();
        initializeTheme();
        syncSidebarState();
        setupEventListeners();
        hydrateSelectedProject();
        const token = getStoredToken();
        if (!token) {
            loadPreviewUser();
            return;
        }
        await loadUserData();
    }
    function cacheElements() {
        userNameElement = document.getElementById("user-name");
        logoutButton = document.getElementById("logout-btn");
        themeToggleButton = document.getElementById("theme-toggle-btn");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
        selectedProjectNameElement = document.getElementById("selected-project-name");
        selectedProjectMetaElement = document.getElementById("selected-project-meta");
        tasksPageSubtitleElement = document.getElementById("tasks-page-subtitle");
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
    function handleEscapeKey(event) {
        if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
            closeSidebar();
        }
    }
    function hydrateSelectedProject() {
        const searchParams = new URLSearchParams(window.location.search);
        const projectName = searchParams.get("projectName")?.trim() || "No project selected";
        const status = searchParams.get("status")?.trim() || "No status yet";
        const creator = searchParams.get("creator")?.trim() || "Unknown creator";
        const createdAt = formatProjectDate(searchParams.get("createdAt")?.trim() || "");
        if (selectedProjectNameElement) {
            selectedProjectNameElement.textContent = projectName;
        }
        if (selectedProjectMetaElement) {
            selectedProjectMetaElement.textContent = `${status} • ${creator} • ${createdAt}`;
        }
        if (tasksPageSubtitleElement && projectName !== "No project selected") {
            tasksPageSubtitleElement.textContent = `Continue planning and delivery for ${projectName}.`;
        }
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
            return "Created recently";
        }
        return `Created ${date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })}`;
    }
})(TasksPage || (TasksPage = {}));
//# sourceMappingURL=tasks.js.map
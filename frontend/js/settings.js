"use strict";
var SettingsPage;
(function (SettingsPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    let currentUser = null;
    let settingsState = {
        profileName: "",
        profileEmail: "",
        theme: "light"
    };
    let userNameElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let appearanceThemeSwitchButton = null;
    let appearanceThemeValueElement = null;
    let changePasswordButton = null;
    let settingsMessageBox = null;
    let nameInput = null;
    let emailInput = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    document.addEventListener("DOMContentLoaded", () => {
        void initializeSettingsPage();
    });
    async function initializeSettingsPage() {
        cacheElements();
        initializeTheme();
        syncSidebarState();
        setupEventListeners();
        hydrateState();
        renderSettingsState();
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
        appearanceThemeSwitchButton = document.getElementById("appearance-theme-switch");
        appearanceThemeValueElement = document.getElementById("appearance-theme-value");
        changePasswordButton = document.getElementById("change-password-btn");
        settingsMessageBox = document.getElementById("settings-message");
        nameInput = document.getElementById("settings-name");
        emailInput = document.getElementById("settings-email");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
    }
    function setupEventListeners() {
        logoutButton?.addEventListener("click", logout);
        themeToggleButton?.addEventListener("click", () => setTheme(getNextTheme()));
        appearanceThemeSwitchButton?.addEventListener("click", () => setTheme(getNextTheme()));
        changePasswordButton?.addEventListener("click", handleChangePasswordClick);
        nameInput?.addEventListener("input", handleNameInput);
        emailInput?.addEventListener("input", handleEmailInput);
        sidebarToggleButton?.addEventListener("click", toggleSidebar);
        sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
        window.addEventListener("resize", syncSidebarState);
        document.addEventListener("keydown", handleEscapeKey);
        document.addEventListener("app-language-change", renderSettingsState);
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
        settingsState.theme = storedTheme || preferredTheme;
        applyTheme(settingsState.theme);
    }
    function hydrateState() {
        const stored = readStoredSettingsState();
        if (stored) {
            settingsState = {
                profileName: stored.profileName,
                profileEmail: stored.profileEmail,
                theme: stored.theme
            };
            applyTheme(settingsState.theme);
            return;
        }
        settingsState = {
            profileName: "",
            profileEmail: "",
            theme: settingsState.theme
        };
        persistSettingsState();
    }
    function readStoredTheme() {
        const value = localStorage.getItem(THEME_STORAGE_KEY);
        return value === "light" || value === "dark" ? value : "";
    }
    function readStoredSettingsState() {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.profileName === "string" &&
                typeof parsed.profileEmail === "string" &&
                (parsed.theme === "light" || parsed.theme === "dark")) {
                return {
                    profileName: parsed.profileName,
                    profileEmail: parsed.profileEmail,
                    theme: parsed.theme
                };
            }
        }
        catch (error) {
            console.warn("Failed to parse settings state:", error);
        }
        return null;
    }
    function persistSettingsState() {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
    }
    function renderSettingsState() {
        if (nameInput) {
            nameInput.value = settingsState.profileName;
        }
        if (emailInput) {
            emailInput.value = settingsState.profileEmail;
        }
        if (appearanceThemeValueElement) {
            appearanceThemeValueElement.textContent = settingsState.theme === "dark" ? i18n("theme.dark") : i18n("theme.light");
        }
        if (appearanceThemeSwitchButton) {
            const isDarkTheme = settingsState.theme === "dark";
            appearanceThemeSwitchButton.setAttribute("aria-checked", String(isDarkTheme));
            appearanceThemeSwitchButton.classList.toggle("is-dark", isDarkTheme);
        }
    }
    function handleNameInput(event) {
        const target = event.target;
        settingsState.profileName = target?.value ?? "";
        persistSettingsState();
    }
    function handleEmailInput(event) {
        const target = event.target;
        settingsState.profileEmail = target?.value ?? "";
        persistSettingsState();
    }
    function getNextTheme() {
        return settingsState.theme === "dark" ? "light" : "dark";
    }
    function setTheme(theme) {
        settingsState.theme = theme;
        applyTheme(theme);
        persistSettingsState();
    }
    function applyTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        if (themeToggleButton) {
            const isDarkTheme = theme === "dark";
            themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
            themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
            themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
        }
        renderSettingsState();
    }
    function handleChangePasswordClick() {
        showSettingsMessage(i18n("settings.changePasswordHint"), "success");
    }
    function showSettingsMessage(text, type = "") {
        if (!settingsMessageBox) {
            return;
        }
        settingsMessageBox.textContent = text;
        settingsMessageBox.className = type ? `form-message ${type}` : "form-message";
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
    function loadPreviewUser() {
        currentUser = {
            id: "preview-user",
            name: "Anna Ivanova",
            email: "anna.ivanova@example.com"
        };
        if (!settingsState.profileName) {
            settingsState.profileName = currentUser.name;
        }
        if (!settingsState.profileEmail) {
            settingsState.profileEmail = currentUser.email;
        }
        persistSettingsState();
        renderSettingsState();
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
    }
    async function loadUserData() {
        try {
            const data = await requestWithAuth("/auth/me");
            currentUser = data.user;
            if (!settingsState.profileName) {
                settingsState.profileName = currentUser.name;
            }
            if (!settingsState.profileEmail) {
                settingsState.profileEmail = currentUser.email;
            }
            persistSettingsState();
            renderSettingsState();
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
                userNameElement.textContent = i18n("common.unavailable");
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
})(SettingsPage || (SettingsPage = {}));
//# sourceMappingURL=settings.js.map
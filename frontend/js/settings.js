"use strict";
var SettingsPage;
(function (SettingsPage) {
    const API_BASE_URL = `${window.location.origin}/api`;
    const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
    const THEME_STORAGE_KEY = "dashboard-theme";
    const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
    const DEFAULT_PROJECT_VIEW_STORAGE_KEY = "defaultProjectView";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
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
    let currentUser = null;
    let settingsState = {
        profileName: "",
        profileEmail: "",
        emailNotifications: true,
        browserNotifications: false,
        defaultProjectView: "grid",
        theme: "light"
    };
    let userNameElement = null;
    let userAvatarElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let appearanceThemeSwitchButton = null;
    let appearanceThemeValueElement = null;
    let changePasswordButton = null;
    let changePasswordModalElement = null;
    let changePasswordFormElement = null;
    let changePasswordMessageBox = null;
    let changePasswordCloseButton = null;
    let cancelChangePasswordButton = null;
    let currentPasswordInput = null;
    let newPasswordInput = null;
    let confirmNewPasswordInput = null;
    let passwordToggleButtons;
    let passwordCloseTimer = null;
    let profileSaveButton = null;
    let profileConfirmModalElement = null;
    let profileConfirmFormElement = null;
    let profileConfirmPasswordInput = null;
    let profileConfirmMessageBox = null;
    let profileConfirmCancelButton = null;
    let profileConfirmSubmitButton = null;
    let settingsMessageBox = null;
    let settingsFormElement = null;
    let nameInput = null;
    let emailInput = null;
    let emailNotificationsSwitchButton = null;
    let browserNotificationsSwitchButton = null;
    let emailNotificationsValueElement = null;
    let browserNotificationsValueElement = null;
    let projectViewButtons;
    let clearLocalDataButton = null;
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
            redirectToLogin();
            return;
        }
        await loadUserData();
    }
    function cacheElements() {
        userNameElement = document.getElementById("user-name");
        userAvatarElement = document.getElementById("user-avatar");
        logoutButton = document.getElementById("logout-btn");
        themeToggleButton = document.getElementById("theme-toggle-btn");
        appearanceThemeSwitchButton = document.getElementById("appearance-theme-switch");
        appearanceThemeValueElement = document.getElementById("appearance-theme-value");
        changePasswordButton = document.getElementById("change-password-btn");
        changePasswordModalElement = document.getElementById("change-password-modal");
        changePasswordFormElement = document.getElementById("change-password-form");
        changePasswordMessageBox = document.getElementById("change-password-modal-message");
        changePasswordCloseButton = document.getElementById("close-change-password-modal");
        cancelChangePasswordButton = document.getElementById("cancel-change-password-btn");
        currentPasswordInput = document.getElementById("current-password-input");
        newPasswordInput = document.getElementById("new-password-input");
        confirmNewPasswordInput = document.getElementById("confirm-new-password-input");
        passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");
        profileSaveButton = document.getElementById("profile-save-btn");
        profileConfirmModalElement = document.getElementById("profile-confirm-modal");
        profileConfirmFormElement = document.getElementById("profile-confirm-form");
        profileConfirmPasswordInput = document.getElementById("profile-confirm-password");
        profileConfirmMessageBox = document.getElementById("profile-confirm-message");
        profileConfirmCancelButton = document.getElementById("profile-confirm-cancel-btn");
        profileConfirmSubmitButton = document.getElementById("profile-confirm-submit-btn");
        settingsMessageBox = document.getElementById("settings-message");
        settingsFormElement = document.getElementById("settings-form");
        nameInput = document.getElementById("settings-name");
        emailInput = document.getElementById("settings-email");
        emailNotificationsSwitchButton = document.getElementById("email-notifications-switch");
        browserNotificationsSwitchButton = document.getElementById("browser-notifications-switch");
        emailNotificationsValueElement = document.getElementById("email-notifications-value");
        browserNotificationsValueElement = document.getElementById("browser-notifications-value");
        projectViewButtons = document.querySelectorAll("[data-project-view]");
        clearLocalDataButton = document.getElementById("clear-local-data-btn");
        sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
        sidebarElement = document.getElementById("dashboard-sidebar");
        sidebarBackdropElement = document.getElementById("sidebar-backdrop");
        if (userNameElement) {
            userNameElement.textContent = "";
        }
    }
    function setupEventListeners() {
        logoutButton?.addEventListener("click", logout);
        themeToggleButton?.addEventListener("click", () => setTheme(getNextTheme()));
        appearanceThemeSwitchButton?.addEventListener("click", () => setTheme(getNextTheme()));
        changePasswordButton?.addEventListener("click", handleChangePasswordClick);
        changePasswordCloseButton?.addEventListener("click", closeChangePasswordModal);
        cancelChangePasswordButton?.addEventListener("click", closeChangePasswordModal);
        changePasswordFormElement?.addEventListener("submit", handleChangePasswordSubmit);
        changePasswordModalElement?.addEventListener("click", handleChangePasswordModalClick);
        passwordToggleButtons.forEach((button) => {
            button.addEventListener("click", () => togglePasswordVisibility(button));
        });
        profileSaveButton?.addEventListener("click", handleProfileSaveClick);
        settingsFormElement?.addEventListener("submit", handleProfileSaveSubmit);
        profileConfirmCancelButton?.addEventListener("click", closeProfileConfirmModal);
        profileConfirmFormElement?.addEventListener("submit", handleProfileConfirmSubmit);
        profileConfirmModalElement?.addEventListener("click", handleProfileConfirmModalClick);
        nameInput?.addEventListener("input", handleNameInput);
        emailInput?.addEventListener("input", handleEmailInput);
        emailNotificationsSwitchButton?.addEventListener("click", () => setEmailNotifications(!settingsState.emailNotifications));
        browserNotificationsSwitchButton?.addEventListener("click", () => setBrowserNotifications(!settingsState.browserNotifications));
        projectViewButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const view = button.dataset.projectView;
                if (view === "grid" || view === "list") {
                    setDefaultProjectView(view);
                }
            });
        });
        clearLocalDataButton?.addEventListener("click", clearAllLocalData);
        sidebarToggleButton?.addEventListener("click", toggleSidebar);
        sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
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
        settingsState.theme = storedTheme || preferredTheme;
        applyTheme(settingsState.theme);
    }
    function handleLanguageChange() {
        renderUserName(currentUser ? "" : i18n("common.unavailable"));
        renderSettingsState();
        syncSidebarState();
    }
    function hydrateState() {
        const stored = readStoredSettingsState();
        if (stored) {
            settingsState = {
                profileName: stored.profileName,
                profileEmail: stored.profileEmail,
                emailNotifications: stored.emailNotifications,
                browserNotifications: stored.browserNotifications,
                defaultProjectView: stored.defaultProjectView,
                theme: stored.theme
            };
        }
        else {
            settingsState = {
                profileName: "",
                profileEmail: "",
                emailNotifications: true,
                browserNotifications: false,
                defaultProjectView: "grid",
                theme: settingsState.theme
            };
        }
        const syncedTheme = readStoredTheme() || settingsState.theme;
        settingsState.theme = syncedTheme;
        const storedDefaultProjectView = readStoredDefaultProjectView();
        if (storedDefaultProjectView) {
            settingsState.defaultProjectView = storedDefaultProjectView;
        }
        localStorage.setItem(DEFAULT_PROJECT_VIEW_STORAGE_KEY, settingsState.defaultProjectView);
        persistSettingsState();
        applyTheme(settingsState.theme);
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
                typeof parsed.emailNotifications === "boolean" &&
                typeof parsed.browserNotifications === "boolean" &&
                (parsed.defaultProjectView === "grid" || parsed.defaultProjectView === "list") &&
                (parsed.theme === "light" || parsed.theme === "dark")) {
                return {
                    profileName: parsed.profileName,
                    profileEmail: parsed.profileEmail,
                    emailNotifications: parsed.emailNotifications,
                    browserNotifications: parsed.browserNotifications,
                    defaultProjectView: parsed.defaultProjectView,
                    theme: parsed.theme
                };
            }
        }
        catch (error) {
            console.error("Error loading user data:", error);
            if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
                redirectToLogin();
                return;
            }
            renderUserName(i18n("common.unavailable"));
            updateUserAvatar(i18n("common.unavailable"));
        }
    }
    function loadPreviewUser() {
        currentUser = {
            id: "preview-user",
            name: "Regular User",
            email: "user@email.com"
        };
        if (!settingsState.profileName) {
            settingsState.profileName = currentUser.name;
        }
        if (!settingsState.profileEmail) {
            settingsState.profileEmail = currentUser.email;
        }
        persistSettingsState();
        renderSettingsState();
        renderUserName();
        updateUserAvatar(getDisplayName(i18n("common.unavailable")));
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
        const name = getDisplayName(fallback);
        userNameElement.textContent = name;
        updateUserAvatar(name);
    }
    function getDisplayName(fallback = "") {
        return settingsState.profileName.trim() || currentUser?.name?.trim() || fallback;
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
})(SettingsPage || (SettingsPage = {}));
//# sourceMappingURL=settings.js.map

namespace SettingsPage {
  const API_BASE_URL = `${window.location.origin}/api`;
  const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
  const THEME_STORAGE_KEY = "dashboard-theme";
  const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
  const MOBILE_SIDEBAR_BREAKPOINT = 960;
  const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

  interface User {
    id: string;
    name: string;
    email: string;
  }

  interface UserResponse {
    user: User;
  }

  interface SettingsState {
    profileName: string;
    profileEmail: string;
    emailNotifications: boolean;
    browserNotifications: boolean;
    defaultProjectView: ProjectView;
    theme: SettingsTheme;
  }

  type SettingsTheme = "light" | "dark";
  type ProjectView = "grid" | "list";

  let currentUser: User | null = null;
  let settingsState: SettingsState = {
    profileName: "",
    profileEmail: "",
    emailNotifications: true,
    browserNotifications: false,
    defaultProjectView: "grid",
    theme: "light"
  };

  let userNameElement: HTMLElement | null = null;
  let userAvatarElement: HTMLElement | null = null;
  let logoutButton: HTMLButtonElement | null = null;
  let themeToggleButton: HTMLButtonElement | null = null;
  let appearanceThemeSwitchButton: HTMLButtonElement | null = null;
  let appearanceThemeValueElement: HTMLElement | null = null;
  let changePasswordButton: HTMLButtonElement | null = null;
  let settingsMessageBox: HTMLElement | null = null;
  let nameInput: HTMLInputElement | null = null;
  let emailInput: HTMLInputElement | null = null;
  let emailNotificationsSwitchButton: HTMLButtonElement | null = null;
  let browserNotificationsSwitchButton: HTMLButtonElement | null = null;
  let emailNotificationsValueElement: HTMLElement | null = null;
  let browserNotificationsValueElement: HTMLElement | null = null;
  let projectViewButtons: NodeListOf<HTMLButtonElement>;
  let clearLocalDataButton: HTMLButtonElement | null = null;
  let sidebarToggleButton: HTMLButtonElement | null = null;
  let sidebarElement: HTMLElement | null = null;
  let sidebarBackdropElement: HTMLElement | null = null;

  document.addEventListener("DOMContentLoaded", () => {
    void initializeSettingsPage();
  });

  async function initializeSettingsPage(): Promise<void> {
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

  function cacheElements(): void {
    userNameElement = document.getElementById("user-name");
    userAvatarElement = document.getElementById("user-avatar");
    logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
    themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
    appearanceThemeSwitchButton = document.getElementById("appearance-theme-switch") as HTMLButtonElement | null;
    appearanceThemeValueElement = document.getElementById("appearance-theme-value");
    changePasswordButton = document.getElementById("change-password-btn") as HTMLButtonElement | null;
    settingsMessageBox = document.getElementById("settings-message");
    nameInput = document.getElementById("settings-name") as HTMLInputElement | null;
    emailInput = document.getElementById("settings-email") as HTMLInputElement | null;
    emailNotificationsSwitchButton = document.getElementById("email-notifications-switch") as HTMLButtonElement | null;
    browserNotificationsSwitchButton = document.getElementById("browser-notifications-switch") as HTMLButtonElement | null;
    emailNotificationsValueElement = document.getElementById("email-notifications-value");
    browserNotificationsValueElement = document.getElementById("browser-notifications-value");
    projectViewButtons = document.querySelectorAll("[data-project-view]");
    clearLocalDataButton = document.getElementById("clear-local-data-btn") as HTMLButtonElement | null;
    sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
    sidebarElement = document.getElementById("dashboard-sidebar");
    sidebarBackdropElement = document.getElementById("sidebar-backdrop");
  }

  function setupEventListeners(): void {
    logoutButton?.addEventListener("click", logout);
    themeToggleButton?.addEventListener("click", () => setTheme(getNextTheme()));
    appearanceThemeSwitchButton?.addEventListener("click", () => setTheme(getNextTheme()));
    changePasswordButton?.addEventListener("click", handleChangePasswordClick);
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
    document.addEventListener("app-language-change", renderSettingsState);

    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (isMobileViewport()) {
          closeSidebar();
        }
      });
    });
  }

  function initializeTheme(): void {
    const storedTheme = readStoredTheme();
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    settingsState.theme = storedTheme || preferredTheme;
    applyTheme(settingsState.theme);
  }

  function hydrateState(): void {
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
      applyTheme(settingsState.theme);
      return;
    }

    settingsState = {
      profileName: "",
      profileEmail: "",
      emailNotifications: true,
      browserNotifications: false,
      defaultProjectView: "grid",
      theme: settingsState.theme
    };
    persistSettingsState();
  }

  function readStoredTheme(): SettingsTheme | "" {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "";
  }

  function readStoredSettingsState(): SettingsState | null {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      if (
        typeof parsed.profileName === "string" &&
        typeof parsed.profileEmail === "string" &&
        typeof parsed.emailNotifications === "boolean" &&
        typeof parsed.browserNotifications === "boolean" &&
        (parsed.defaultProjectView === "grid" || parsed.defaultProjectView === "list") &&
        (parsed.theme === "light" || parsed.theme === "dark")
      ) {
        return {
          profileName: parsed.profileName,
          profileEmail: parsed.profileEmail,
          emailNotifications: parsed.emailNotifications,
          browserNotifications: parsed.browserNotifications,
          defaultProjectView: parsed.defaultProjectView,
          theme: parsed.theme
        };
      }
    } catch (error) {
      console.warn("Failed to parse settings state:", error);
    }

    return null;
  }

  function persistSettingsState(): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
  }

  function renderSettingsState(): void {
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

    renderPreferenceSwitch(
      emailNotificationsSwitchButton,
      emailNotificationsValueElement,
      settingsState.emailNotifications
    );
    renderPreferenceSwitch(
      browserNotificationsSwitchButton,
      browserNotificationsValueElement,
      settingsState.browserNotifications
    );

    projectViewButtons.forEach((button) => {
      const isActive = button.dataset.projectView === settingsState.defaultProjectView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function handleNameInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    settingsState.profileName = target?.value ?? "";
    persistSettingsState();
  }

  function handleEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    settingsState.profileEmail = target?.value ?? "";
    persistSettingsState();
  }

  function setEmailNotifications(isEnabled: boolean): void {
    settingsState.emailNotifications = isEnabled;
    persistSettingsState();
    renderSettingsState();
  }

  function setBrowserNotifications(isEnabled: boolean): void {
    settingsState.browserNotifications = isEnabled;
    persistSettingsState();
    renderSettingsState();
  }

  function setDefaultProjectView(view: ProjectView): void {
    settingsState.defaultProjectView = view;
    persistSettingsState();
    renderSettingsState();
  }

  function getNextTheme(): SettingsTheme {
    return settingsState.theme === "dark" ? "light" : "dark";
  }

  function setTheme(theme: SettingsTheme): void {
    settingsState.theme = theme;
    applyTheme(theme);
    persistSettingsState();
  }

  function applyTheme(theme: SettingsTheme): void {
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

  function handleChangePasswordClick(): void {
    showSettingsMessage(i18n("settings.changePasswordHint"), "success");
  }

  function renderPreferenceSwitch(
    button: HTMLButtonElement | null,
    valueElement: HTMLElement | null,
    isEnabled: boolean
  ): void {
    if (button) {
      button.setAttribute("aria-checked", String(isEnabled));
      button.classList.toggle("is-active", isEnabled);
    }

    if (valueElement) {
      valueElement.textContent = isEnabled ? i18n("settings.toggleOn") : i18n("settings.toggleOff");
    }
  }

  function clearAllLocalData(): void {
    localStorage.clear();
    window.location.reload();
  }

  function showSettingsMessage(text: string, type: "success" | "error" | "" = ""): void {
    if (!settingsMessageBox) {
      return;
    }

    settingsMessageBox.textContent = text;
    settingsMessageBox.className = type ? `form-message ${type}` : "form-message";
  }

  function isMobileViewport(): boolean {
    return window.innerWidth <= MOBILE_SIDEBAR_BREAKPOINT;
  }

  function syncSidebarState(): void {
    if (!sidebarElement || !sidebarToggleButton || !sidebarBackdropElement) {
      return;
    }

    if (!isMobileViewport()) {
      document.body.classList.remove("sidebar-open");
    }

    const isSidebarOpen = !isMobileViewport() || document.body.classList.contains("sidebar-open");

    sidebarElement.setAttribute("aria-hidden", String(!isSidebarOpen));
    sidebarToggleButton.setAttribute("aria-expanded", String(isMobileViewport() && document.body.classList.contains("sidebar-open")));
    sidebarToggleButton.setAttribute(
      "aria-label",
      document.body.classList.contains("sidebar-open") ? "Close navigation menu" : "Open navigation menu"
    );
    sidebarBackdropElement.hidden = !(isMobileViewport() && document.body.classList.contains("sidebar-open"));
  }

  function openSidebar(): void {
    if (!isMobileViewport()) {
      return;
    }

    document.body.classList.add("sidebar-open");
    syncSidebarState();
  }

  function closeSidebar(): void {
    document.body.classList.remove("sidebar-open");
    syncSidebarState();
  }

  function toggleSidebar(): void {
    if (document.body.classList.contains("sidebar-open")) {
      closeSidebar();
      return;
    }

    openSidebar();
  }

  function handleSidebarBackdropClick(event: Event): void {
    const target = event.target as HTMLElement | null;

    if (target?.dataset.closeSidebar === "true") {
      closeSidebar();
    }
  }

  function handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  }

  function loadPreviewUser(): void {
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
    updateUserAvatar(currentUser.name);
  }

  async function loadUserData(): Promise<void> {
    try {
      const data = await requestWithAuth<UserResponse>("/auth/me");
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
      updateUserAvatar(currentUser.name);
    } catch (error) {
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

  function getStoredToken(): string {
    return localStorage.getItem("token")?.trim() || "";
  }

  function redirectToLogin(): void {
    window.location.href = "../index.html";
  }

  function logout(): void {
    closeSidebar();
    localStorage.removeItem("token");
    void fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "same-origin"
    });
    redirectToLogin();
  }

  function updateUserAvatar(name: string): void {
    if (!userAvatarElement) {
      return;
    }

    userAvatarElement.textContent = getInitials(name);
  }

  function getInitials(name: string): string {
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

  async function requestWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
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

    return data as T;
  }

  function readMessage(data: unknown, fallback: string): string {
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;

      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  function getErrorText(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}

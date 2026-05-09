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
    theme: SettingsTheme;
  }

  type SettingsTheme = "light" | "dark";

  let currentUser: User | null = null;
  let settingsState: SettingsState = {
    profileName: "",
    profileEmail: "",
    theme: "light"
  };

  let userNameElement: HTMLElement | null = null;
  let logoutButton: HTMLButtonElement | null = null;
  let themeToggleButton: HTMLButtonElement | null = null;
  let appearanceThemeSwitchButton: HTMLButtonElement | null = null;
  let appearanceThemeValueElement: HTMLElement | null = null;
  let changePasswordButton: HTMLButtonElement | null = null;
  let settingsMessageBox: HTMLElement | null = null;
  let nameInput: HTMLInputElement | null = null;
  let emailInput: HTMLInputElement | null = null;
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
    logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
    themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
    appearanceThemeSwitchButton = document.getElementById("appearance-theme-switch") as HTMLButtonElement | null;
    appearanceThemeValueElement = document.getElementById("appearance-theme-value");
    changePasswordButton = document.getElementById("change-password-btn") as HTMLButtonElement | null;
    settingsMessageBox = document.getElementById("settings-message");
    nameInput = document.getElementById("settings-name") as HTMLInputElement | null;
    emailInput = document.getElementById("settings-email") as HTMLInputElement | null;
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
        (parsed.theme === "light" || parsed.theme === "dark")
      ) {
        return {
          profileName: parsed.profileName,
          profileEmail: parsed.profileEmail,
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
    } catch (error) {
      console.error("Error loading user data:", error);

      if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
        return;
      }

      if (userNameElement) {
        userNameElement.textContent = i18n("common.unavailable");
      }
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

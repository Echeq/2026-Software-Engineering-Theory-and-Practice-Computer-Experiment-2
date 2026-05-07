namespace TasksPage {
  const API_BASE_URL = `${window.location.origin}/api`;
  const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
  const THEME_STORAGE_KEY = "dashboard-theme";
  const MOBILE_SIDEBAR_BREAKPOINT = 960;

  interface User {
    id: string;
    name: string;
    email: string;
  }

  interface UserResponse {
    user: User;
  }

  type TasksTheme = "light" | "dark";

  let currentUser: User | null = null;
  let userNameElement: HTMLElement | null = null;
  let logoutButton: HTMLButtonElement | null = null;
  let themeToggleButton: HTMLButtonElement | null = null;
  let sidebarToggleButton: HTMLButtonElement | null = null;
  let sidebarElement: HTMLElement | null = null;
  let sidebarBackdropElement: HTMLElement | null = null;
  let selectedProjectNameElement: HTMLElement | null = null;
  let selectedProjectMetaElement: HTMLElement | null = null;
  let tasksPageSubtitleElement: HTMLElement | null = null;

  document.addEventListener("DOMContentLoaded", () => {
    void initializeTasksPage();
  });

  async function initializeTasksPage(): Promise<void> {
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

  function cacheElements(): void {
    userNameElement = document.getElementById("user-name");
    logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
    themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
    sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
    sidebarElement = document.getElementById("dashboard-sidebar");
    sidebarBackdropElement = document.getElementById("sidebar-backdrop");
    selectedProjectNameElement = document.getElementById("selected-project-name");
    selectedProjectMetaElement = document.getElementById("selected-project-meta");
    tasksPageSubtitleElement = document.getElementById("tasks-page-subtitle");
  }

  function setupEventListeners(): void {
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

  function initializeTheme(): void {
    const storedTheme = readStoredTheme();
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(storedTheme || preferredTheme);
  }

  function readStoredTheme(): TasksTheme | "" {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "";
  }

  function toggleTheme(): void {
    const nextTheme: TasksTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  function applyTheme(theme: TasksTheme): void {
    document.body.dataset.theme = theme;

    if (!themeToggleButton) {
      return;
    }

    const isDarkTheme = theme === "dark";
    themeToggleButton.textContent = isDarkTheme ? "Light Mode" : "Dark Mode";
    themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
    themeToggleButton.setAttribute("aria-label", isDarkTheme ? "Switch to light mode" : "Switch to dark mode");
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

  function hydrateSelectedProject(): void {
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

  function loadPreviewUser(): void {
    currentUser = {
      id: "preview-user",
      name: "Anna Ivanova",
      email: "anna.ivanova@example.com"
    };

    if (userNameElement) {
      userNameElement.textContent = currentUser.name;
    }
  }

  async function loadUserData(): Promise<void> {
    try {
      const data = await requestWithAuth<UserResponse>("/auth/me");
      currentUser = data.user;

      if (userNameElement) {
        userNameElement.textContent = currentUser.name;
      }
    } catch (error) {
      console.error("Error loading user data:", error);

      if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
        return;
      }

      if (userNameElement) {
        userNameElement.textContent = "Unavailable";
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

  function formatProjectDate(dateString: string): string {
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
}

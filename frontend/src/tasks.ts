import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, isSessionError, logout } from "./core/services";

namespace TasksPage {
  const THEME_STORAGE_KEY = "dashboard-theme";
  const MOBILE_SIDEBAR_BREAKPOINT = 960;
  const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

  interface User {
    id: string;
    name: string;
    email: string;
  }

  type TasksTheme = "light" | "dark";

  let currentUser: User | null = null;
  let userNameElement: HTMLElement | null = null;
  let userAvatarElement: HTMLElement | null = null;
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

    await loadUserData();
  }

  function cacheElements(): void {
    userNameElement = document.getElementById("user-name");
    userAvatarElement = document.getElementById("user-avatar");
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
    logoutButton?.addEventListener("click", handleLogout);
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
    themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
    themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
    themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
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
    const projectName = searchParams.get("projectName")?.trim() || i18n("tasks.noProject");
    const status = searchParams.get("status")?.trim() || i18n("status.planning");
    const creator = searchParams.get("creator")?.trim() || i18n("common.unavailable");
    const createdAt = formatProjectDate(searchParams.get("createdAt")?.trim() || "");

    if (selectedProjectNameElement) {
      selectedProjectNameElement.textContent = projectName;
    }

    if (selectedProjectMetaElement) {
      selectedProjectMetaElement.textContent = `${status} • ${creator} • ${createdAt}`;
    }

    if (tasksPageSubtitleElement && projectName !== i18n("tasks.noProject")) {
      tasksPageSubtitleElement.textContent = i18n("tasks.subtitleProject", { projectName });
    }
  }

  async function loadUserData(): Promise<void> {
    try {
      currentUser = await getCurrentUser();

      if (userNameElement) {
        userNameElement.textContent = currentUser.name;
      }
      updateUserAvatar(currentUser.name);
    } catch (error) {
      if (isSessionError(error)) {
        redirectToLogin();
        return;
      }

      if (userNameElement) {
        userNameElement.textContent = i18n("common.unavailable");
      }
      updateUserAvatar(i18n("common.unavailable"));
    }
  }

  function redirectToLogin(): void {
    window.location.href = "/";
  }

  async function handleLogout(): Promise<void> {
    closeSidebar();
    await logout();
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

  function formatProjectDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return i18n("common.createdRecently");
    }

    const locale = window.I18n?.getLanguage() === "zh" ? "zh-CN" : window.I18n?.getLanguage() === "es" ? "es-ES" : "en-US";
    return i18n("common.createdDate", { date: date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) });
  }
}

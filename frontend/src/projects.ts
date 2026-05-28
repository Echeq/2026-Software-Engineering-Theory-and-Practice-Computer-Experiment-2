import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, isSessionError, logout } from "./core/services";

type ProjectsTheme = "light" | "dark";

const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

let userNameElement: HTMLElement | null = null;
let userAvatarElement: HTMLElement | null = null;
let projectsMessageBox: HTMLElement | null = null;
let logoutButton: HTMLButtonElement | null = null;
let themeToggleButton: HTMLButtonElement | null = null;
let sidebarToggleButton: HTMLButtonElement | null = null;
let sidebarElement: HTMLElement | null = null;
let sidebarBackdropElement: HTMLElement | null = null;
let projectsLanguageInput: HTMLInputElement | null = null;

document.addEventListener("DOMContentLoaded", () => {
  void initializeProjectsPage();
});

async function initializeProjectsPage(): Promise<void> {
  cacheElements();
  initializeTheme();
  syncSidebarState();
  syncLanguageInput();
  setupEventListeners();
  renderBoardLoading();
  await loadUserData();
  refreshProjectsBoard();
}

function cacheElements(): void {
  userNameElement = document.getElementById("user-name");
  userAvatarElement = document.getElementById("user-avatar");
  projectsMessageBox = document.getElementById("projects-message");
  logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
  themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
  sidebarElement = document.getElementById("dashboard-sidebar");
  sidebarBackdropElement = document.getElementById("sidebar-backdrop");
  projectsLanguageInput = document.getElementById("projects-language-input") as HTMLInputElement | null;
}

function setupEventListeners(): void {
  logoutButton?.addEventListener("click", handleLogout);
  themeToggleButton?.addEventListener("click", toggleTheme);
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

function initializeTheme(): void {
  const storedTheme = readStoredTheme();
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(storedTheme || preferredTheme);
}

function readStoredTheme(): ProjectsTheme | "" {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : "";
}

function toggleTheme(): void {
  const nextTheme: ProjectsTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

function applyTheme(theme: ProjectsTheme): void {
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

async function loadUserData(): Promise<void> {
  try {
    const user = await getCurrentUser();

    if (userNameElement) {
      userNameElement.textContent = user.name;
    }

    updateUserAvatar(user.name);
    clearProjectsMessage();
  } catch (error) {
    if (isSessionError(error)) {
      redirectToLogin();
      return;
    }

    if (userNameElement) {
      userNameElement.textContent = i18n("common.unavailable");
    }

    updateUserAvatar(i18n("common.unavailable"));
    showProjectsMessage(error instanceof Error ? error.message : i18n("dashboard.projectsUnavailable"), "error");
  }
}

function updateUserAvatar(name: string): void {
  if (!userAvatarElement) {
    return;
  }

  userAvatarElement.textContent = getInitials(name);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function handleLanguageChange(): void {
  syncLanguageInput();
  refreshProjectsBoard();
}

function syncLanguageInput(): void {
  if (projectsLanguageInput) {
    projectsLanguageInput.value = window.I18n?.getLanguage() || "en";
  }
}

function refreshProjectsBoard(): void {
  if (window.htmx) {
    window.htmx.trigger(document.body, "projects:refresh");
  }
}

function renderBoardLoading(): void {
  const board = document.getElementById("projects-board");

  if (!board) {
    return;
  }

  board.innerHTML = `
    <article class="state-card">
      <h3>${i18n("dashboard.loadingTitle")}</h3>
      <p>${i18n("projects.loadingText")}</p>
    </article>
  `;
}

function showProjectsMessage(text: string, type?: "error" | "success"): void {
  if (!projectsMessageBox) {
    return;
  }

  projectsMessageBox.textContent = text;
  projectsMessageBox.className = type ? `form-message ${type}` : "form-message";
}

function clearProjectsMessage(): void {
  showProjectsMessage("");
}

async function handleLogout(): Promise<void> {
  closeSidebar();
  await logout();
  redirectToLogin();
}

function redirectToLogin(): void {
  window.location.href = "/";
}

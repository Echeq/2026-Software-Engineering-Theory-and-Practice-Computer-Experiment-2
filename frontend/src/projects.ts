import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, getProjectTasks, isSessionError, logout } from "./core/services";

type ProjectsTheme = "light" | "dark";
type ProjectView = "grid" | "list";

const THEME_STORAGE_KEY = "dashboard-theme";
const LEGACY_THEME_STORAGE_KEY = "theme";
const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

let userNameElement: HTMLElement | null = null;
let userAvatarElement: HTMLElement | null = null;
let projectsMessageBox: HTMLElement | null = null;
let projectsBoardElement: HTMLElement | null = null;
let logoutButton: HTMLButtonElement | null = null;
let themeToggleButton: HTMLButtonElement | null = null;
let sidebarToggleButton: HTMLButtonElement | null = null;
let sidebarElement: HTMLElement | null = null;
let sidebarBackdropElement: HTMLElement | null = null;
let projectsLanguageInput: HTMLInputElement | null = null;
let projectViewButtons: NodeListOf<HTMLButtonElement>;
let currentProjectView: ProjectView = "grid";

document.addEventListener("DOMContentLoaded", () => {
  void initializeProjectsPage();
});

async function initializeProjectsPage(): Promise<void> {
  cacheElements();
  initializeTheme();
  initializeProjectView();
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
  projectsBoardElement = document.getElementById("projects-board");
  logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
  themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
  sidebarElement = document.getElementById("dashboard-sidebar");
  sidebarBackdropElement = document.getElementById("sidebar-backdrop");
  projectsLanguageInput = document.getElementById("projects-language-input") as HTMLInputElement | null;
  projectViewButtons = document.querySelectorAll("[data-project-view]");
}

function setupEventListeners(): void {
  logoutButton?.addEventListener("click", handleLogout);
  themeToggleButton?.addEventListener("click", toggleTheme);
  sidebarToggleButton?.addEventListener("click", toggleSidebar);
  sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
  window.addEventListener("resize", syncSidebarState);
  document.addEventListener("keydown", handleEscapeKey);
  document.addEventListener("app-language-change", handleLanguageChange);
  document.addEventListener("htmx:afterSwap", handleProjectsAfterSwap as EventListener);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void refreshProjectCardsFromApi();
    }
  });
  window.addEventListener("focus", () => {
    void refreshProjectCardsFromApi();
  });
  window.addEventListener("pageshow", () => {
    void refreshProjectCardsFromApi();
  });
  projectViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.projectView;
      if (view === "grid" || view === "list") {
        setProjectView(view);
      }
    });
  });

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

function initializeProjectView(): void {
  currentProjectView = readStoredProjectView();
  renderProjectView();
}

function readStoredTheme(): ProjectsTheme | "" {
  const value = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : "";
}

function toggleTheme(): void {
  const nextTheme: ProjectsTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function applyTheme(theme: ProjectsTheme): void {
  document.body.dataset.theme = theme;
  persistTheme(theme);

  if (!themeToggleButton) {
    return;
  }

  const isDarkTheme = theme === "dark";
  themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
  themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
  themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
}

function persistTheme(theme: ProjectsTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
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
    document.body.classList.contains("sidebar-open") ? i18n("app.aria.closeNavigationMenu") : i18n("app.aria.openNavigationMenu")
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
  renderProjectView();
  refreshProjectsBoard();
  void refreshProjectCardsFromApi();
}

function handleProjectsAfterSwap(event: Event): void {
  const customEvent = event as CustomEvent;

  if (!(customEvent.target instanceof HTMLElement) || customEvent.target.id !== "projects-board") {
    return;
  }

  renderProjectView();
  void refreshProjectCardsFromApi();
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

function formatProjectCompletionLabel(percentage: number): string {
  return i18n("common.percentComplete", { percent: percentage });
}

function formatProjectCompletionCounter(completedTasks: number, totalTasks: number): string {
  if (totalTasks <= 0) {
    return i18n("common.noTasksYet");
  }

  return `${completedTasks}/${totalTasks}`;
}

function getProjectCompletionTone(percentage: number): "low" | "medium" | "high" {
  if (percentage <= 30) {
    return "low";
  }

  if (percentage <= 60) {
    return "medium";
  }

  return "high";
}

function createProjectCompletionSummary(totalTasks: number, completedTasks: number) {
  const safeTotalTasks = Math.max(0, totalTasks);
  const safeCompletedTasks = Math.min(Math.max(0, completedTasks), safeTotalTasks);
  const percentage = safeTotalTasks > 0
    ? Math.round((safeCompletedTasks / safeTotalTasks) * 100)
    : 0;

  return {
    percentage,
    tone: getProjectCompletionTone(percentage),
    label: formatProjectCompletionLabel(percentage),
    totalTasks: safeTotalTasks,
    completedTasks: safeCompletedTasks,
    counterLabel: formatProjectCompletionCounter(safeCompletedTasks, safeTotalTasks)
  };
}

function isCompletedTaskStatus(status: unknown): boolean {
  return typeof status === "string" && status.trim().toLowerCase() === "done";
}

function getProjectIdKey(projectId: unknown): string {
  if (projectId === null || projectId === undefined) {
    return "";
  }

  return String(projectId).trim();
}

function applyProjectCompletionSummaryToCard(
  card: HTMLElement,
  summary: ReturnType<typeof createProjectCompletionSummary>
): void {
  const taskCountElement = card.querySelector<HTMLElement>(".project-task-count");
  const metaElement = card.querySelector<HTMLElement>(".project-meta");
  let progressRow = card.querySelector<HTMLElement>(".project-progress-row");
  let progressTrack = card.querySelector<HTMLElement>(".project-progress-track");
  let progressFill = card.querySelector<HTMLElement>(".project-progress-fill");
  let progressText = card.querySelector<HTMLElement>(".project-progress-text");
  let progressCounter = card.querySelector<HTMLElement>(".project-progress-counter");

  if (!progressRow && metaElement) {
    progressRow = document.createElement("div");
    progressTrack = document.createElement("div");
    progressFill = document.createElement("span");
    progressText = document.createElement("span");
    progressCounter = document.createElement("p");

    progressRow.className = "project-progress-row";
    progressTrack.className = "project-progress-track";
    progressFill.className = "project-progress-fill";
    progressText.className = "project-progress-text";
    progressCounter.className = "project-progress-counter";

    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", "100");

    progressTrack.appendChild(progressFill);
    progressRow.appendChild(progressTrack);
    progressRow.appendChild(progressText);
    metaElement.insertAdjacentElement("afterend", progressRow);
    progressRow.insertAdjacentElement("afterend", progressCounter);
  }

  if (taskCountElement) {
    taskCountElement.textContent = i18n("common.tasksCount", { count: summary.totalTasks });
  }

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

  if (progressCounter) {
    progressCounter.textContent = summary.counterLabel;
  }
}

async function refreshProjectCardsFromApi(): Promise<void> {
  if (!projectsBoardElement) {
    return;
  }

  const projectCards = Array.from(projectsBoardElement.querySelectorAll<HTMLElement>(".project-card-link[data-project-id]"));
  if (projectCards.length === 0) {
    return;
  }

  try {
    await Promise.all(projectCards.map(async (card) => {
      const projectId = getProjectIdKey(card.getAttribute("data-project-id") || "");
      if (!projectId) {
        return;
      }

      const tasks = await getProjectTasks(projectId);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task) => isCompletedTaskStatus(task.status)).length;
      const summary = createProjectCompletionSummary(totalTasks, completedTasks);
      applyProjectCompletionSummaryToCard(card, summary);
    }));
  } catch (error) {
    console.warn("Error reading project completion from API:", error);
  }
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

function readStoredProjectView(): ProjectView {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return "grid";
  }

  try {
    const parsed = JSON.parse(raw) as { defaultProjectView?: unknown };
    return parsed.defaultProjectView === "list" ? "list" : "grid";
  } catch (_error) {
    return "grid";
  }
}

function setProjectView(view: ProjectView): void {
  if (currentProjectView === view) {
    return;
  }

  currentProjectView = view;
  persistProjectView(view);
  renderProjectView();
}

function renderProjectView(): void {
  if (projectsBoardElement) {
    projectsBoardElement.className = currentProjectView === "list"
      ? "projects-grid projects-view-list"
      : "projects-grid projects-view-grid";
  }

  projectViewButtons.forEach((button) => {
    const isActive = button.dataset.projectView === currentProjectView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function persistProjectView(view: ProjectView): void {
  const nextState = readStoredSettingsState();
  nextState.defaultProjectView = view;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextState));
}

function readStoredSettingsState(): {
  profileName: string;
  profileEmail: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  defaultProjectView: ProjectView;
  theme: "light" | "dark";
} {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return createDefaultSettingsState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<{
      profileName: string;
      profileEmail: string;
      emailNotifications: boolean;
      browserNotifications: boolean;
      defaultProjectView: ProjectView;
      theme: "light" | "dark";
    }>;

    return {
      profileName: typeof parsed.profileName === "string" ? parsed.profileName : "",
      profileEmail: typeof parsed.profileEmail === "string" ? parsed.profileEmail : "",
      emailNotifications: typeof parsed.emailNotifications === "boolean" ? parsed.emailNotifications : true,
      browserNotifications: typeof parsed.browserNotifications === "boolean" ? parsed.browserNotifications : false,
      defaultProjectView: parsed.defaultProjectView === "list" ? "list" : "grid",
      theme: parsed.theme === "dark" ? "dark" : "light"
    };
  } catch (_error) {
    return createDefaultSettingsState();
  }
}

function createDefaultSettingsState(): {
  profileName: string;
  profileEmail: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  defaultProjectView: ProjectView;
  theme: "light" | "dark";
} {
  return {
    profileName: "",
    profileEmail: "",
    emailNotifications: true,
    browserNotifications: false,
    defaultProjectView: "grid",
    theme: "light"
  };
}

async function handleLogout(): Promise<void> {
  closeSidebar();
  await logout();
  redirectToLogin();
}

function redirectToLogin(): void {
  window.location.href = "/";
}

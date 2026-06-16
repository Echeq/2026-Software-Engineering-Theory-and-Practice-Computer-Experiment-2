import "../css/dashboard.css";
import "./i18n";
import { getCurrentUser, isSessionError, logout, createProject } from "./core/services";

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
let projectModalElement: HTMLElement | null = null;
let projectFormElement: HTMLFormElement | null = null;
let projectNameInput: HTMLInputElement | null = null;
let projectDescriptionInput: HTMLTextAreaElement | null = null;
let projectFormMessageBox: HTMLElement | null = null;
let projectSubmitButton: HTMLButtonElement | null = null;
let closeProjectModalButton: HTMLButtonElement | null = null;
let cancelProjectModalButton: HTMLButtonElement | null = null;

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
  projectModalElement = document.getElementById("project-modal");
  projectFormElement = document.getElementById("project-form") as HTMLFormElement | null;
  projectNameInput = document.getElementById("project-name") as HTMLInputElement | null;
  projectDescriptionInput = document.getElementById("project-description") as HTMLTextAreaElement | null;
  projectFormMessageBox = document.getElementById("project-form-message");
  projectSubmitButton = document.getElementById("project-submit-btn") as HTMLButtonElement | null;
  closeProjectModalButton = document.getElementById("close-project-modal") as HTMLButtonElement | null;
  cancelProjectModalButton = document.getElementById("cancel-project-btn") as HTMLButtonElement | null;
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

  document.getElementById("new-project-btn")?.addEventListener("click", openProjectModal);
  closeProjectModalButton?.addEventListener("click", closeProjectModal);
  cancelProjectModalButton?.addEventListener("click", closeProjectModal);
  projectModalElement?.addEventListener("click", handleProjectModalClick);
  projectFormElement?.addEventListener("submit", handleProjectFormSubmit);

  const board = document.getElementById("projects-board");
  board?.addEventListener("click", (event: Event) => {
    const target = event.target as HTMLElement;
    const closeBtn = target.closest(".project-close-btn") as HTMLElement | null;
    if (closeBtn) {
      const projectId = closeBtn.dataset.projectId!;
      const projectName = closeBtn.dataset.projectName!;
      const action = closeBtn.dataset.action || "close";
      void handleCloseProject(projectId, projectName, action);
      return;
    }
    const deleteBtn = target.closest(".project-delete-btn") as HTMLElement | null;
    if (deleteBtn) {
      const projectId = deleteBtn.dataset.projectId!;
      const projectName = deleteBtn.dataset.projectName!;
      void handleDeleteProject(projectId, projectName);
    }
  });

  document.addEventListener("htmx:afterSettle", (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.target instanceof HTMLElement && customEvent.target.id === "projects-board") {
      document.getElementById("empty-state-create-project-btn")?.addEventListener("click", openProjectModal, { once: true });
    }
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
  if (event.key !== "Escape") return;
  if (projectModalElement && !projectModalElement.hidden) {
    closeProjectModal();
    return;
  }
  if (document.body.classList.contains("sidebar-open")) {
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

    const canManageProjects = user.role === "support" || user.role === "manager";
    const createBtn = document.getElementById("new-project-btn");
    if (createBtn) createBtn.style.display = canManageProjects ? "" : "none";

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

function openProjectModal(): void {
  if (!projectModalElement) return;
  closeSidebar();
  projectModalElement.hidden = false;
  projectModalElement.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  projectNameInput?.focus();
}

function closeProjectModal(): void {
  if (!projectModalElement) return;
  projectModalElement.hidden = true;
  projectModalElement.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  projectFormElement?.reset();
  resetProjectFormErrors();
  setProjectSubmitting(false);
}

function handleProjectModalClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (target?.dataset.closeModal === "true") {
    closeProjectModal();
  }
}

function resetProjectFormErrors(): void {
  document.querySelectorAll<HTMLElement>(".field-error").forEach((el) => {
    el.textContent = "";
  });
}

function setProjectFieldError(inputId: string, message: string): void {
  const errorEl = document.querySelector<HTMLElement>(`[data-error-for="${inputId}"]`);
  if (errorEl) errorEl.textContent = message;
}

function showProjectFormMessage(text: string, type?: "error" | "success"): void {
  if (!projectFormMessageBox) return;
  projectFormMessageBox.textContent = text;
  projectFormMessageBox.className = type ? `form-message ${type}` : "form-message";
}

function setProjectSubmitting(isSubmitting: boolean): void {
  if (!projectSubmitButton) return;
  projectSubmitButton.disabled = isSubmitting;
  projectSubmitButton.textContent = isSubmitting ? i18n("dashboard.projectSubmitting") : i18n("dashboard.projectSubmit");
}

function validateProjectForm(name: string, description: string): boolean {
  let isValid = true;
  if (!name) {
    setProjectFieldError("project-name", i18n("dashboard.validation.projectRequired"));
    isValid = false;
  } else if (name.length < 2) {
    setProjectFieldError("project-name", i18n("dashboard.validation.projectShort"));
    isValid = false;
  }
  if (description.length > 500) {
    setProjectFieldError("project-description", i18n("dashboard.validation.projectDescriptionLong"));
    isValid = false;
  }
  return isValid;
}

async function handleProjectFormSubmit(event: Event): Promise<void> {
  event.preventDefault();
  if (!projectFormElement || !projectNameInput) return;
  const name = projectNameInput.value.trim();
  const description = projectDescriptionInput?.value.trim() || "";
  if (!validateProjectForm(name, description)) {
    showProjectFormMessage(i18n("dashboard.validation.fix"), "error");
    return;
  }
  setProjectSubmitting(true);
  try {
    await createProject({ name, description: description || undefined });
    closeProjectModal();
    showProjectsMessage(i18n("dashboard.projectCreated"), "success");
    refreshProjectsBoard();
  } catch (error) {
    if (isSessionError(error)) {
      redirectToLogin();
      return;
    }
    showProjectFormMessage(error instanceof Error ? error.message : i18n("dashboard.projectCreateFailed"), "error");
  } finally {
    setProjectSubmitting(false);
  }
}

async function requestWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  const token = localStorage.getItem("spmp-csrf-token");
  if (token) headers["X-CSRF-Token"] = token;
  const res = await fetch(`/api${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function showMessage(text: string, type: "success" | "error"): void {
  showProjectsMessage(text, type);
}

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function handleCloseProject(projectId: string, projectName: string, action: string): Promise<void> {
  const isReopen = action === "reopen";
  const confirmKey = isReopen ? "projects.confirmReopenProject" : "projects.confirmCloseProject";
  if (!confirm(i18n(confirmKey, { name: projectName }))) return;
  try {
    const endpoint = isReopen ? `/projects/${projectId}/reopen` : `/projects/${projectId}/close`;
    await requestWithAuth(endpoint, { method: "PATCH" });
    const msgKey = isReopen ? "projects.projectReopened" : "projects.projectClosed";
    showMessage(i18n(msgKey), "success");
    refreshProjectsBoard();
  } catch (error) {
    if (isSessionError(error)) { redirectToLogin(); return; }
    showMessage(getErrorText(error, i18n("projects.failedCloseProject")), "error");
  }
}

async function handleDeleteProject(projectId: string, projectName: string): Promise<void> {
  if (!confirm(i18n("projects.confirmDeleteProject", { name: projectName }))) return;
  try {
    await requestWithAuth(`/projects/${projectId}`, { method: "DELETE" });
    showMessage(i18n("projects.projectDeleted"), "success");
    refreshProjectsBoard();
  } catch (error) {
    if (isSessionError(error)) { redirectToLogin(); return; }
    showMessage(getErrorText(error, i18n("projects.failedDeleteProject")), "error");
  }
}

async function handleLogout(): Promise<void> {
  closeSidebar();
  await logout();
  redirectToLogin();
}

function redirectToLogin(): void {
  window.location.href = "/";
}

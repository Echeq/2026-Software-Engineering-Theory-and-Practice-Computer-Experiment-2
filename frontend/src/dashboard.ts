import "../css/dashboard.css";
import "./i18n";
import { Project } from "./core/app";
import { createProject, getCurrentUser, getProjectTasks, getProjects, isSessionError, logout } from "./core/services";

/* Original pre-sidebar layout backed up in ./dashboard.layout-backup.ts */
const THEME_STORAGE_KEY = "dashboard-theme";
const MOBILE_SIDEBAR_BREAKPOINT = 960;
const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

interface User {
  id: string;
  name: string;
  email: string;
}

type DashboardTheme = "light" | "dark";
type ProjectSortOption = "newest" | "oldest" | "az";

let currentUser: User | null = null;
let userNameElement: HTMLElement | null = null;
let userAvatarElement: HTMLElement | null = null;
let greetingTitleElement: HTMLElement | null = null;
let greetingDateElement: HTMLTimeElement | null = null;
let projectsMessageBox: HTMLElement | null = null;
let projectsListElement: HTMLElement | null = null;
let projectSortSelectElement: HTMLSelectElement | null = null;
let newProjectButton: HTMLButtonElement | null = null;
let logoutButton: HTMLButtonElement | null = null;
let themeToggleButton: HTMLButtonElement | null = null;
let sidebarToggleButton: HTMLButtonElement | null = null;
let sidebarElement: HTMLElement | null = null;
let sidebarBackdropElement: HTMLElement | null = null;
let projectModalElement: HTMLElement | null = null;
let projectFormElement: HTMLFormElement | null = null;
let projectNameInput: HTMLInputElement | null = null;
let projectDescriptionInput: HTMLTextAreaElement | null = null;
let projectFormMessageBox: HTMLElement | null = null;
let projectSubmitButton: HTMLButtonElement | null = null;
let closeProjectModalButton: HTMLButtonElement | null = null;
let cancelProjectModalButton: HTMLButtonElement | null = null;
let projectSearchInput: HTMLInputElement | null = null;
let projectStatusInput: HTMLInputElement | null = null;
let projectLanguageInput: HTMLInputElement | null = null;

document.addEventListener("DOMContentLoaded", () => {
  void initializeDashboard();
});

async function initializeDashboard(): Promise<void> {
  cacheElements();
  initializeTheme();
  refreshGreetingBanner();
  syncSidebarState();
  syncLanguageInput();
  setupEventListeners();

  renderProjectsLoading();
  await loadUserData();
  void renderCharts();
  refreshProjectsList();
}

function cacheElements(): void {
  userNameElement = document.getElementById("user-name");
  userAvatarElement = document.getElementById("user-avatar");
  greetingTitleElement = document.getElementById("greeting-banner-title");
  greetingDateElement = document.getElementById("greeting-banner-date") as HTMLTimeElement | null;
  projectsMessageBox = document.getElementById("projects-message");
  projectsListElement = document.getElementById("projects-list");
  projectSortSelectElement = document.getElementById("project-sort-select") as HTMLSelectElement | null;
  newProjectButton = document.getElementById("new-project-btn") as HTMLButtonElement | null;
  logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
  themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
  sidebarElement = document.getElementById("dashboard-sidebar");
  sidebarBackdropElement = document.getElementById("sidebar-backdrop");
  projectModalElement = document.getElementById("project-modal");
  projectFormElement = document.getElementById("project-form") as HTMLFormElement | null;
  projectNameInput = document.getElementById("project-name") as HTMLInputElement | null;
  projectDescriptionInput = document.getElementById("project-description") as HTMLTextAreaElement | null;
  projectFormMessageBox = document.getElementById("project-form-message");
  projectSubmitButton = document.getElementById("project-submit-btn") as HTMLButtonElement | null;
  closeProjectModalButton = document.getElementById("close-project-modal") as HTMLButtonElement | null;
  cancelProjectModalButton = document.getElementById("cancel-project-btn") as HTMLButtonElement | null;
  projectSearchInput = document.getElementById("project-search-input") as HTMLInputElement | null;
  projectStatusInput = document.getElementById("project-status-input") as HTMLInputElement | null;
  projectLanguageInput = document.getElementById("project-language-input") as HTMLInputElement | null;
}

function setupEventListeners(): void {
  logoutButton?.addEventListener("click", logout);
  themeToggleButton?.addEventListener("click", toggleTheme);
  sidebarToggleButton?.addEventListener("click", toggleSidebar);
  sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
  newProjectButton?.addEventListener("click", openProjectModal);
  closeProjectModalButton?.addEventListener("click", closeProjectModal);
  cancelProjectModalButton?.addEventListener("click", closeProjectModal);
  projectFormElement?.addEventListener("submit", handleProjectSubmit);
  projectModalElement?.addEventListener("click", handleProjectModalClick);
  projectSortSelectElement?.addEventListener("change", handleProjectSortChange);
  window.addEventListener("resize", syncSidebarState);
  document.addEventListener("keydown", handleEscapeKey);
  document.addEventListener("app-language-change", refreshGreetingBanner);
  document.addEventListener("app-language-change", handleLanguageChange);
  document.addEventListener("htmx:afterSwap", handleProjectsAfterSwap as EventListener);
  document.querySelectorAll<HTMLButtonElement>(".filter-button").forEach((button) => {
    button.addEventListener("click", () => handleFilterButtonClick(button));
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

function readStoredTheme(): DashboardTheme | "" {
  const value = localStorage.getItem(THEME_STORAGE_KEY);

  if (value === "light" || value === "dark") {
    return value;
  }

  return "";
}

function toggleTheme(): void {
  const nextTheme: DashboardTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
}

function applyTheme(theme: DashboardTheme): void {
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

async function loadUserData(): Promise<void> {
  try {
    currentUser = await getCurrentUser();

    if (userNameElement) {
      userNameElement.textContent = currentUser.name;
    }
    updateUserAvatar(currentUser.name);

    refreshGreetingBanner();
  } catch (error) {
    if (isSessionError(error)) {
      redirectToLogin();
      return;
    }

    if (userNameElement) {
      userNameElement.textContent = i18n("common.unavailable");
    }
    updateUserAvatar(i18n("common.unavailable"));

    refreshGreetingBanner();
  }
}

function refreshProjectsList(): void {
  if (window.htmx) {
    window.htmx.trigger(document.body, "projects:refresh");
  }
}

function renderProjectsLoading(): void {
  if (!projectsListElement) {
    return;
  }

  projectsListElement.innerHTML = `
    ${Array.from({ length: 3 }, () => `
      <article class="project-card skeleton-card" aria-hidden="true">
        <div class="skeleton-line skeleton-line-title"></div>
        <div class="skeleton-line skeleton-line-badge"></div>
        <div class="skeleton-line skeleton-line-body"></div>
        <div class="skeleton-line skeleton-line-body is-short"></div>
        <div class="skeleton-line skeleton-line-footer"></div>
      </article>
    `).join("")}
  `;
}

async function handleProjectSubmit(event: Event): Promise<void> {
  event.preventDefault();
  resetProjectFormErrors();

  if (!projectNameInput || !projectDescriptionInput) {
    return;
  }

  const name = projectNameInput.value.trim();
  const description = projectDescriptionInput.value.trim();
  const isValid = validateProjectForm(name, description);

  if (!isValid) {
    showProjectFormMessage(i18n("dashboard.validation.fix"), "error");
    return;
  }

  setProjectSubmitting(true);

  try {
    await createProject({
      name,
      description: description || undefined
    });

    closeProjectModal();
    showProjectsMessage(i18n("dashboard.projectCreated"), "success");
    refreshProjectsList();
  } catch (error) {
    if (isSessionError(error)) {
      redirectToLogin();
      return;
    }

    showProjectFormMessage(getErrorText(error, i18n("dashboard.projectCreateFailed")), "error");
  } finally {
    setProjectSubmitting(false);
  }
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

function setProjectFieldError(fieldId: string, text: string): void {
  const input = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement | null;
  const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`) as HTMLElement | null;

  input?.classList.add("input-error");

  if (errorBox) {
    errorBox.textContent = text;
  }
}

function resetProjectFormErrors(): void {
  showProjectFormMessage("");

  projectFormElement?.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });

  projectFormElement?.querySelectorAll(".input-error").forEach((element) => {
    element.classList.remove("input-error");
  });
}

function showProjectsMessage(text: string, type?: "error" | "success"): void {
  if (!projectsMessageBox) {
    return;
  }

  projectsMessageBox.textContent = text;
  projectsMessageBox.className = type ? `form-message ${type}` : "form-message";
}

function showProjectFormMessage(text: string, type?: "error" | "success"): void {
  if (!projectFormMessageBox) {
    return;
  }

  projectFormMessageBox.textContent = text;
  projectFormMessageBox.className = type ? `form-message ${type}` : "form-message";
}

function setProjectSubmitting(isSubmitting: boolean): void {
  if (!projectSubmitButton) {
    return;
  }

  projectSubmitButton.disabled = isSubmitting;
  projectSubmitButton.textContent = isSubmitting ? i18n("dashboard.projectSubmitting") : i18n("dashboard.projectSubmit");
}

function openProjectModal(): void {
  if (!projectModalElement) {
    return;
  }

  closeSidebar();
  projectModalElement.hidden = false;
  projectModalElement.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  projectNameInput?.focus();
}

function closeProjectModal(): void {
  if (!projectModalElement) {
    return;
  }

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

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }

  if (projectModalElement && !projectModalElement.hidden) {
    closeProjectModal();
    return;
  }

  if (document.body.classList.contains("sidebar-open")) {
    closeSidebar();
  }
}

function handleProjectSortChange(): void {
  sortRenderedProjectCards();
}

function handleFilterButtonClick(button: HTMLButtonElement): void {
  const value = button.value || "all";

  if (projectStatusInput) {
    projectStatusInput.value = value;
  }

  document.querySelectorAll<HTMLButtonElement>(".filter-button").forEach((item) => {
    const isActive = item === button;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });

  refreshProjectsList();
}

function handleProjectsAfterSwap(event: Event): void {
  const customEvent = event as CustomEvent;

  if (!(customEvent.target instanceof HTMLElement) || customEvent.target.id !== "projects-list") {
    return;
  }

  document.getElementById("empty-state-create-project-btn")?.addEventListener("click", openProjectModal, { once: true });
  sortRenderedProjectCards();
}

function handleLanguageChange(): void {
  refreshGreetingBanner();
  syncLanguageInput();
  refreshProjectsList();
}

function refreshGreetingBanner(): void {
  const today = new Date();
  const displayName = currentUser?.name.trim() || "";

  if (greetingTitleElement) {
    greetingTitleElement.textContent = displayName
      ? i18n("dashboard.greetingMorning", { name: displayName })
      : i18n("dashboard.greetingMorningFallback");
  }

  if (greetingDateElement) {
    greetingDateElement.textContent = formatGreetingDate(today);
    greetingDateElement.dateTime = today.toISOString().slice(0, 10);
  }
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

function redirectToLogin(): void {
  window.location.href = "/";
}

async function handleLogout(): Promise<void> {
  closeSidebar();
  await logout();
  redirectToLogin();
}

function readSelectedSort(): ProjectSortOption {
  const value = projectSortSelectElement?.value;

  if (value === "oldest" || value === "az") {
    return value;
  }

  return "newest";
}

function sortProjects(projects: Project[], sort: ProjectSortOption): Project[] {
  const copy = [...projects];

  if (sort === "az") {
    copy.sort((left, right) => left.name.localeCompare(right.name, getCurrentLocale(), { sensitivity: "base" }));
    return copy;
  }

  copy.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;

    return sort === "oldest" ? safeLeftTime - safeRightTime : safeRightTime - safeLeftTime;
  });

  return copy;
}

function sortRenderedProjectCards(): void {
  if (!projectsListElement) {
    return;
  }

  const cards = Array.from(projectsListElement.querySelectorAll<HTMLElement>(".project-card-link"));

  if (cards.length <= 1) {
    return;
  }

  const sort = readSelectedSort();
  const collator = new Intl.Collator(getCurrentLocale(), { sensitivity: "base" });

  cards.sort((left, right) => {
    if (sort === "az") {
      return collator.compare(readProjectName(left), readProjectName(right));
    }

    const leftTime = readProjectCreatedAt(left);
    const rightTime = readProjectCreatedAt(right);
    return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
  });

  cards.forEach((card) => {
    projectsListElement?.appendChild(card);
  });
}

function readProjectName(card: HTMLElement): string {
  return card.querySelector(".project-name")?.textContent?.trim() || "";
}

function readProjectCreatedAt(card: HTMLElement): number {
  const href = card.getAttribute("href") || "";
  const queryStartIndex = href.indexOf("?");

  if (queryStartIndex === -1) {
    return 0;
  }

  const params = new URLSearchParams(href.slice(queryStartIndex + 1));
  const createdAt = params.get("createdAt") || "";
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getErrorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatStatus(status: string): string {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function syncLanguageInput(): void {
  if (projectLanguageInput) {
    projectLanguageInput.value = window.I18n?.getLanguage() || "en";
  }
}

function formatProjectDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return i18n("common.createdRecently");
  }

  return i18n("common.createdDate", { date: date.toLocaleDateString(getCurrentLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) });
}

function formatGreetingDate(date: Date): string {
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getCurrentLocale(): string {
  const language = window.I18n?.getLanguage();

  if (language === "zh") {
    return "zh-CN";
  }

  if (language === "es") {
    return "es-ES";
  }

  return "en-US";
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function renderCharts(): Promise<void> {
  const Chart = (window as any).Chart;
  if (!Chart) return;

  try {
    const projects = await getProjects();
    const statusCounts: Record<string, number> = {};
    for (const p of projects) {
      const s = p.status || "planning";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }
    const statusLabels: Record<string, string> = {
      planning: i18n("status.planning"),
      active: i18n("status.active"),
      "in-review": i18n("status.inReview"),
      done: i18n("status.done"),
    };
    const labels = Object.keys(statusCounts).map(k => statusLabels[k] || k);
    const data = Object.values(statusCounts);

    const statusCanvas = document.getElementById("project-status-chart") as HTMLCanvasElement | null;
    if (statusCanvas && labels.length > 0) {
      new Chart(statusCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{ data, backgroundColor: ["#6366f1", "#22c55e", "#f59e0b", "#94a3b8"] }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
      });
    }

    let taskAll: { status: string }[] = [];
    for (const p of projects) {
      try { taskAll = taskAll.concat(await getProjectTasks(p.id)); } catch { /* skip */ }
    }

    const taskStatusLabels: Record<string, string> = {
      pending: i18n("tasks.status.todo"),
      "in-progress": i18n("tasks.status.inProgress"),
      "in review": i18n("tasks.status.inProgress"),
      done: i18n("tasks.status.done"),
    };
    const taskCounts: Record<string, number> = {};
    for (const t of taskAll) {
      const s = t.status || "pending";
      taskCounts[s] = (taskCounts[s] || 0) + 1;
    }
    const tLabels = Object.keys(taskCounts).map(k => taskStatusLabels[k] || k);
    const tData = Object.values(taskCounts);

    const taskCanvas = document.getElementById("task-overview-chart") as HTMLCanvasElement | null;
    if (taskCanvas && tLabels.length > 0) {
      new Chart(taskCanvas, {
        type: "bar",
        data: {
          labels: tLabels,
          datasets: [{ label: i18n("tasks.pageTag"), data: tData, backgroundColor: "#6366f1" }],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } },
      });
    }
  } catch { /* charts unavailable */ }
}

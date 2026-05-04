namespace ProjectsPage {
  const API_BASE_URL = `${window.location.origin}/api`;
  const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";
  const THEME_STORAGE_KEY = "dashboard-theme";
  const MOBILE_SIDEBAR_BREAKPOINT = 960;

  interface User {
    id: string;
    name: string;
    email: string;
  }

  interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    status: string;
    created_at: string;
  }

  interface UserResponse {
    user: User;
  }

  interface ProjectsResponse {
    projects: Project[];
  }

  interface KanbanColumn {
    id: "start-next" | "in-progress" | "done";
    title: string;
    caption: string;
  }

  type ProjectsTheme = "light" | "dark";

  const KANBAN_COLUMNS: KanbanColumn[] = [
    {
      id: "start-next",
      title: "Start Next",
      caption: "Queued, planning, and next-up work."
    },
    {
      id: "in-progress",
      title: "In Progress",
      caption: "Active delivery and review right now."
    },
    {
      id: "done",
      title: "Done",
      caption: "Completed work ready for reference."
    }
  ];

  const PREVIEW_PROJECTS: Project[] = [
    {
      id: "preview-start-next",
      name: "Semester Project Planner",
      description: "Plan milestones, deadlines, and release order before implementation begins.",
      owner_id: "preview-user",
      status: "planning",
      created_at: new Date("2026-03-12").toISOString()
    },
    {
      id: "preview-in-progress",
      name: "Research Collaboration Hub",
      description: "Coordinate active project updates, meeting notes, and shared feedback across the team.",
      owner_id: "preview-user",
      status: "active",
      created_at: new Date("2026-04-02").toISOString()
    },
    {
      id: "preview-done",
      name: "Frontend Showcase",
      description: "Completed presentation-ready project used to review the latest interface iteration.",
      owner_id: "preview-user",
      status: "done",
      created_at: new Date("2026-04-18").toISOString()
    }
  ];

  let currentUser: User | null = null;
  let isPreviewMode = false;
  let userNameElement: HTMLElement | null = null;
  let projectsMessageBox: HTMLElement | null = null;
  let projectsBoardElement: HTMLElement | null = null;
  let logoutButton: HTMLButtonElement | null = null;
  let themeToggleButton: HTMLButtonElement | null = null;
  let sidebarToggleButton: HTMLButtonElement | null = null;
  let sidebarElement: HTMLElement | null = null;
  let sidebarBackdropElement: HTMLElement | null = null;

  document.addEventListener("DOMContentLoaded", () => {
    void initializeProjectsPage();
  });

  async function initializeProjectsPage(): Promise<void> {
    cacheElements();
    initializeTheme();
    syncSidebarState();
    setupEventListeners();

    const token = getStoredToken();

    if (!token) {
      loadPreviewProjectsBoard();
      return;
    }

    renderBoardLoading();
    await loadUserData();
    await loadProjects();
  }

  function cacheElements(): void {
    userNameElement = document.getElementById("user-name");
    projectsMessageBox = document.getElementById("projects-message");
    projectsBoardElement = document.getElementById("projects-board");
    logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
    themeToggleButton = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
    sidebarToggleButton = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
    sidebarElement = document.getElementById("dashboard-sidebar");
    sidebarBackdropElement = document.getElementById("sidebar-backdrop");
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

  function loadPreviewProjectsBoard(): void {
    isPreviewMode = true;
    currentUser = {
      id: "preview-user",
      name: "Anna Ivanova",
      email: "anna.ivanova@example.com"
    };

    if (userNameElement) {
      userNameElement.textContent = currentUser.name;
    }

    showProjectsMessage("Preview mode: the projects board is shown with demo data.", "success");
    renderProjectsBoard(PREVIEW_PROJECTS);
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

  async function loadProjects(): Promise<void> {
    showProjectsMessage("");
    renderBoardLoading();

    try {
      const data = await requestWithAuth<ProjectsResponse>("/projects");
      renderProjectsBoard(data.projects);
    } catch (error) {
      console.error("Error loading projects:", error);

      if (getErrorText(error, "") === SESSION_EXPIRED_MESSAGE) {
        return;
      }

      renderBoardError(getErrorText(error, "Failed to load projects. Please refresh the page."));
    }
  }

  function renderBoardLoading(): void {
    if (!projectsBoardElement) {
      return;
    }

    projectsBoardElement.innerHTML = `
      <article class="state-card">
        <h3>Loading projects...</h3>
        <p>Preparing your kanban board.</p>
      </article>
    `;
  }

  function renderProjectsBoard(projects: Project[]): void {
    if (!projectsBoardElement) {
      return;
    }

    const groupedProjects = groupProjectsByColumn(projects);
    projectsBoardElement.innerHTML = KANBAN_COLUMNS.map((column) => renderColumn(column, groupedProjects[column.id])).join("");
  }

  function groupProjectsByColumn(projects: Project[]): Record<KanbanColumn["id"], Project[]> {
    const grouped: Record<KanbanColumn["id"], Project[]> = {
      "start-next": [],
      "in-progress": [],
      done: []
    };

    projects.forEach((project) => {
      grouped[getColumnId(project.status)].push(project);
    });

    return grouped;
  }

  function getColumnId(status: string): KanbanColumn["id"] {
    const normalizedStatus = status.trim().toLowerCase();

    if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(normalizedStatus)) {
      return "done";
    }

    if (["active", "in-progress", "in review", "in-review", "review", "blocked"].includes(normalizedStatus)) {
      return "in-progress";
    }

    return "start-next";
  }

  function renderColumn(column: KanbanColumn, projects: Project[]): string {
    const cardsMarkup = projects.length > 0
      ? projects.map((project) => renderProjectCard(project)).join("")
      : `
          <article class="state-card empty-column-card">
            <h3>No projects</h3>
            <p>No projects are currently assigned to this column.</p>
          </article>
        `;

    return `
      <section class="kanban-column" aria-labelledby="column-${column.id}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="column-${column.id}" class="kanban-column-title">${column.title}</h3>
            <p class="kanban-column-caption">${column.caption}</p>
          </div>
          <span class="kanban-count" aria-label="${projects.length} projects">${projects.length}</span>
        </header>
        <div class="kanban-list">
          ${cardsMarkup}
        </div>
      </section>
    `;
  }

  function renderProjectCard(project: Project): string {
    const creatorName = escapeHtml(currentUser?.name || "You");
    const description = project.description?.trim()
      ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
      : '<p class="project-description is-empty">No description yet.</p>';
    const query = new URLSearchParams({
      projectId: project.id,
      projectName: project.name,
      status: formatStatus(project.status),
      creator: currentUser?.name || "You",
      createdAt: project.created_at
    }).toString();

    return `
      <a class="project-card project-card-link" href="./tasks.html?${query}" data-project-id="${escapeHtml(project.id)}">
        <div class="project-head">
          <h3 class="project-name">${escapeHtml(project.name)}</h3>
          <span class="project-status">${escapeHtml(formatStatus(project.status))}</span>
        </div>
        ${description}
        <div class="project-meta">
          <div class="project-meta-stack">
            <span class="project-owner">${creatorName}</span>
            <span class="project-date">${escapeHtml(formatProjectDate(project.created_at))}</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderBoardError(text: string): void {
    if (!projectsBoardElement) {
      return;
    }

    projectsBoardElement.innerHTML = `
      <article class="state-card">
        <h3>Projects unavailable</h3>
        <p>${escapeHtml(text)}</p>
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

  function getStoredToken(): string {
    return localStorage.getItem("token")?.trim() || "";
  }

  function redirectToLogin(): void {
    window.location.href = "../index.html";
  }

  function logout(): void {
    closeSidebar();
    localStorage.removeItem("token");
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
      headers
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

  function formatStatus(status: string): string {
    return status
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
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

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

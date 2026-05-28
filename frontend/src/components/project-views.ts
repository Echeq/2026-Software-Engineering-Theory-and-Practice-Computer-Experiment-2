import type { Project } from "../core/app";
import { escapeHtml, formatProjectDate, formatStatus, normalizeProjectColumn } from "../core/format";
import { getLocale, t } from "../core/app";

type ProjectSort = "newest" | "oldest" | "az";
type ProjectFilter = "all" | "active" | "in-review" | "planning";

export function renderProjectGrid(target: HTMLElement, projects: Project[], options: {
  filter: ProjectFilter;
  search: string;
  sort: ProjectSort;
  ownerName: string;
  tasksPath: string;
}): void {
  const filtered = sortProjects(filterProjects(projects, options.filter, options.search), options.sort);

  if (filtered.length === 0) {
    target.innerHTML = `
      <article class="state-card empty-state-card">
        <div class="empty-state-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 120" class="empty-state-svg" focusable="false">
            <rect x="26" y="24" width="108" height="72" rx="14"></rect>
            <rect x="42" y="40" width="38" height="8" rx="4"></rect>
            <rect x="42" y="56" width="62" height="6" rx="3"></rect>
            <rect x="42" y="68" width="48" height="6" rx="3"></rect>
            <circle cx="116" cy="52" r="10"></circle>
            <path d="M118 18l6 8"></path>
            <path d="M30 96l10-10"></path>
          </svg>
        </div>
        <h3>${escapeHtml(t("dashboard.noProjects"))}</h3>
        <p>${escapeHtml(t("dashboard.noProjectsFoundText"))}</p>
      </article>
    `;
    return;
  }

  target.innerHTML = filtered.map((project) => renderProjectCard(project, options.ownerName, options.tasksPath)).join("");
}

export function renderProjectsBoard(target: HTMLElement, projects: Project[], ownerName: string, tasksPath: string): void {
  const columns = [
    { id: "start-next", title: t("projects.startNext"), caption: t("projects.startNextCaption") },
    { id: "in-progress", title: t("projects.inProgress"), caption: t("projects.inProgressCaption") },
    { id: "done", title: t("projects.done"), caption: t("projects.doneCaption") }
  ] as const;

  const groups = {
    "start-next": projects.filter((project) => normalizeProjectColumn(project.status) === "start-next"),
    "in-progress": projects.filter((project) => normalizeProjectColumn(project.status) === "in-progress"),
    done: projects.filter((project) => normalizeProjectColumn(project.status) === "done")
  };

  target.innerHTML = columns.map((column) => {
    const items = groups[column.id];
    const cards = items.length > 0
      ? items.map((project) => renderProjectCard(project, ownerName, tasksPath)).join("")
      : `
        <article class="state-card empty-column-card">
          <h3>${escapeHtml(t("projects.emptyColumn"))}</h3>
          <p>${escapeHtml(t("projects.emptyColumnText"))}</p>
        </article>
      `;

    return `
      <section class="kanban-column" aria-labelledby="column-${column.id}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="column-${column.id}" class="kanban-column-title">${escapeHtml(column.title)}</h3>
            <p class="kanban-column-caption">${escapeHtml(column.caption)}</p>
          </div>
          <span class="kanban-count">${items.length}</span>
        </header>
        <div class="kanban-list">${cards}</div>
      </section>
    `;
  }).join("");
}

function renderProjectCard(project: Project, ownerName: string, tasksPath: string): string {
  const query = new URLSearchParams({
    projectId: project.id,
    projectName: project.name,
    status: formatStatus(project.status),
    creator: ownerName,
    createdAt: project.created_at
  }).toString();
  const description = project.description?.trim()
    ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
    : `<p class="project-description is-empty">${escapeHtml("No description yet.")}</p>`;

  return `
    <a class="project-card project-card-link" href="${tasksPath}?${query}" data-project-id="${escapeHtml(project.id)}">
      <div class="project-head">
        <div class="project-title-wrap">
          <h3 class="project-name">${escapeHtml(project.name)}</h3>
          <span class="project-task-count">${escapeHtml(t("common.tasksCount", { count: project.taskCount ?? 0 }))}</span>
        </div>
        <span class="project-status">${getStatusIconMarkup(project.status.trim().toLowerCase())}${escapeHtml(formatStatus(project.status))}</span>
      </div>
      ${description}
      <div class="project-meta">
        <span class="project-owner">${escapeHtml(ownerName)}</span>
        <span>${escapeHtml(formatProjectDate(project.created_at))}</span>
      </div>
    </a>
  `;
}

function filterProjects(projects: Project[], filter: ProjectFilter, search: string): Project[] {
  const normalizedSearch = search.trim().toLocaleLowerCase(getLocale());

  return projects.filter((project) => {
    const matchesFilter = filter === "all" || normalizeFilter(project.status) === filter;
    const haystack = `${project.name} ${project.description || ""}`.toLocaleLowerCase(getLocale());
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });
}

function normalizeFilter(status: string): ProjectFilter {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active") {
    return "active";
  }

  if (["in-review", "in review", "review", "blocked"].includes(normalized)) {
    return "in-review";
  }

  if (["planning", "planned", "start-next", "queued"].includes(normalized)) {
    return "planning";
  }

  return "all";
}

function sortProjects(projects: Project[], sort: ProjectSort): Project[] {
  const copy = [...projects];

  if (sort === "az") {
    copy.sort((left, right) => left.name.localeCompare(right.name, getLocale(), { sensitivity: "base" }));
    return copy;
  }

  copy.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
  });

  return copy;
}

function getStatusIconMarkup(status: string): string {
  if (status === "active") {
    return '<span class="status-indicator" aria-hidden="true"></span><svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 8h2l1.25-3 2 6 1.5-4h3.75" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  if (["planning", "planned", "start-next", "queued"].includes(status)) {
    return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 5.25V8l1.75 1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(status)) {
    return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 8.1 7.2 9.8l3.3-3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  return "";
}

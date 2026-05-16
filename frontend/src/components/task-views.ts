import type { Task } from "../core/app";
import { escapeHtml, normalizeTaskColumn } from "../core/format";

export function renderTaskBoard(target: HTMLElement, tasks: Task[]): void {
  const columns = [
    { id: "todo", title: "To Do", caption: "Work that has not started yet." },
    { id: "doing", title: "In Progress", caption: "Tasks currently being delivered." },
    { id: "done", title: "Done", caption: "Completed tasks kept for reference." }
  ] as const;

  target.innerHTML = columns.map((column) => {
    const items = tasks.filter((task) => normalizeTaskColumn(task.status) === column.id);
    const cards = items.length > 0
      ? items.map((task) => renderTaskCard(task)).join("")
      : `
        <article class="state-card empty-column-card">
          <h3>No tasks</h3>
          <p>Nothing is currently in this column.</p>
        </article>
      `;

    return `
      <section class="kanban-column" aria-labelledby="task-column-${column.id}">
        <header class="kanban-column-header">
          <div class="kanban-column-copy">
            <h3 id="task-column-${column.id}" class="kanban-column-title">${escapeHtml(column.title)}</h3>
            <p class="kanban-column-caption">${escapeHtml(column.caption)}</p>
          </div>
          <span class="kanban-count">${items.length}</span>
        </header>
        <div class="kanban-list">${cards}</div>
      </section>
    `;
  }).join("");
}

function renderTaskCard(task: Task): string {
  const description = task.description?.trim()
    ? `<p class="project-description">${escapeHtml(task.description.trim())}</p>`
    : `<p class="project-description is-empty">${escapeHtml("No details added yet.")}</p>`;

  return `
    <article class="project-card">
      <div class="project-head">
        <div class="project-title-wrap">
          <h3 class="project-name">${escapeHtml(task.title)}</h3>
          <span class="project-task-count">${escapeHtml(task.priority)}</span>
        </div>
        <span class="project-status">${escapeHtml(task.status)}</span>
      </div>
      ${description}
      <div class="project-meta">
        <span>${escapeHtml(task.due_date ? `Due ${task.due_date.slice(0, 10)}` : "No due date")}</span>
      </div>
    </article>
  `;
}

import "./i18n";
import "../css/dashboard.css";
import { getAppContext, t } from "./core/app";
import { formatProjectDate } from "./core/format";
import { createTask, getCurrentUser, getProjectTasks, isSessionError } from "./core/services";
import { setupAppShell } from "./components/app-shell";
import { renderTaskBoard } from "./components/task-views";

const shell = setupAppShell();
const selectedProjectName = document.getElementById("selected-project-name");
const selectedProjectMeta = document.getElementById("selected-project-meta");
const subtitle = document.getElementById("tasks-page-subtitle");
const board = document.getElementById("tasks-board");
const form = document.getElementById("task-form") as HTMLFormElement | null;
const messageBox = document.getElementById("tasks-message");
const projectId = new URLSearchParams(window.location.search).get("projectId")?.trim() || "";

void initialize();

async function initialize(): Promise<void> {
  hydrateProjectCopy();

  try {
    const user = await getCurrentUser();
    shell.applyUser(user);

    if (!projectId) {
      return;
    }

    const tasks = await getProjectTasks(projectId);
    if (board) {
      renderTaskBoard(board, tasks);
    }
  } catch (error) {
    if (isSessionError(error)) {
      window.location.href = getAppContext().routes.login;
      return;
    }

    if (messageBox) {
      messageBox.textContent = error instanceof Error ? error.message : "Failed to load tasks.";
      messageBox.className = "form-message error";
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!projectId) {
      return;
    }

    const title = readInput("task-title");
    const description = readInput("task-description");
    const dueDate = readInput("task-due-date");
    const priority = readInput("task-priority") || "medium";

    if (!title) {
      if (messageBox) {
        messageBox.textContent = "Task title is required.";
        messageBox.className = "form-message error";
      }
      return;
    }

    try {
      await createTask({
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        project_id: projectId
      });
      const tasks = await getProjectTasks(projectId);
      if (board) {
        renderTaskBoard(board, tasks);
      }
      if (messageBox) {
        messageBox.textContent = "Task created successfully.";
        messageBox.className = "form-message success";
      }
      form.reset();
    } catch (error) {
      if (messageBox) {
        messageBox.textContent = error instanceof Error ? error.message : "Failed to create task.";
        messageBox.className = "form-message error";
      }
    }
  });
}

function hydrateProjectCopy(): void {
  const params = new URLSearchParams(window.location.search);
  const projectName = params.get("projectName")?.trim() || t("tasks.noProject");
  const status = params.get("status")?.trim() || t("status.planning");
  const creator = params.get("creator")?.trim() || t("common.unavailable");
  const createdAt = formatProjectDate(params.get("createdAt")?.trim() || "");

  if (selectedProjectName) {
    selectedProjectName.textContent = projectName;
  }

  if (selectedProjectMeta) {
    selectedProjectMeta.textContent = projectName === t("tasks.noProject")
      ? t("tasks.noProjectMeta")
      : `${status} • ${creator} • ${createdAt}`;
  }

  if (subtitle && projectName !== t("tasks.noProject")) {
    subtitle.textContent = t("tasks.subtitleProject", { projectName });
  }
}

function readInput(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value.trim() || "";
}

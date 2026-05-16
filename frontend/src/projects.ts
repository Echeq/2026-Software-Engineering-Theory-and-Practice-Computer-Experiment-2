import "./i18n";
import "../css/dashboard.css";
import { getAppContext, t } from "./core/app";
import { getCurrentUser, getProjects, isSessionError } from "./core/services";
import { setupAppShell } from "./components/app-shell";
import { renderProjectsBoard } from "./components/project-views";

const shell = setupAppShell();
const board = document.getElementById("projects-board");
const messageBox = document.getElementById("projects-message");

void initialize();

async function initialize(): Promise<void> {
  try {
    const [user, projects] = await Promise.all([getCurrentUser(), getProjects()]);
    shell.applyUser(user);

    if (board) {
      renderProjectsBoard(board, projects, user.name, getAppContext().routes.tasks);
    }
  } catch (error) {
    if (isSessionError(error)) {
      window.location.href = getAppContext().routes.login;
      return;
    }

    if (messageBox) {
      messageBox.textContent = error instanceof Error ? error.message : t("dashboard.projectsUnavailable");
      messageBox.className = "form-message error";
    }
  }
}

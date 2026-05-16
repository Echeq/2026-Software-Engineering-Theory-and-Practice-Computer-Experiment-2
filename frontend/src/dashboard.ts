import "./i18n";
import "../css/dashboard.css";
import { getAppContext, t, type Project } from "./core/app";
import { formatGreetingDate } from "./core/format";
import { createProject, getCurrentUser, getProjects, isSessionError } from "./core/services";
import { setupAppShell } from "./components/app-shell";
import { renderProjectGrid } from "./components/project-views";

let projects: Project[] = [];
let currentUserName = t("common.you");
const shell = setupAppShell();
const messageBox = document.getElementById("projects-message");
const projectsList = document.getElementById("projects-list");
const greetingTitle = document.getElementById("greeting-banner-title");
const greetingDate = document.getElementById("greeting-banner-date") as HTMLTimeElement | null;
const searchInput = document.getElementById("project-search-input") as HTMLInputElement | null;
const sortSelect = document.getElementById("project-sort-select") as HTMLSelectElement | null;
const statusButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".filter-button"));
const modal = document.getElementById("project-modal");
const form = document.getElementById("project-form") as HTMLFormElement | null;
const submitButton = document.getElementById("project-submit-btn") as HTMLButtonElement | null;
const formMessage = document.getElementById("project-form-message");

void initialize();

async function initialize(): Promise<void> {
  refreshGreeting();

  try {
    const [user, loadedProjects] = await Promise.all([getCurrentUser(), getProjects()]);
    shell.applyUser(user);
    currentUserName = user.name;
    if (greetingTitle) {
      greetingTitle.textContent = t("dashboard.greetingMorning", { name: user.name });
    }
    projects = loadedProjects;
    renderProjects(user.name);
  } catch (error) {
    if (isSessionError(error)) {
      window.location.href = getAppContext().routes.login;
      return;
    }

    showMessage(error instanceof Error ? error.message : t("dashboard.projectsUnavailable"), "error");
  }

  searchInput?.addEventListener("input", async () => {
    renderProjects(currentUserName);
  });

  sortSelect?.addEventListener("change", () => {
    renderProjects(currentUserName);
  });

  statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      statusButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderProjects(currentUserName);
    });
  });

  document.getElementById("new-project-btn")?.addEventListener("click", openModal);
  document.getElementById("close-project-modal")?.addEventListener("click", closeModal);
  document.getElementById("cancel-project-btn")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.dataset.closeModal === "true") {
      closeModal();
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearProjectErrors();

    const name = readInput("project-name");
    const description = readInput("project-description");
    let isValid = true;

    if (!name) {
      setProjectError("project-name", t("dashboard.validation.projectRequired"));
      isValid = false;
    } else if (name.length < 2) {
      setProjectError("project-name", t("dashboard.validation.projectShort"));
      isValid = false;
    }

    if (description.length > 500) {
      setProjectError("project-description", t("dashboard.validation.projectDescriptionLong"));
      isValid = false;
    }

    if (!isValid) {
      if (formMessage) {
        formMessage.textContent = t("dashboard.validation.fix");
        formMessage.className = "form-message error";
      }
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = t("dashboard.projectSubmitting");
    }

    try {
      const created = await createProject({
        name,
        description: description || undefined
      });
      projects = [created, ...projects];
      renderProjects(currentUserName);
      showMessage(t("dashboard.projectCreated"), "success");
      closeModal();
    } catch (error) {
      if (formMessage) {
        formMessage.textContent = error instanceof Error ? error.message : t("dashboard.projectCreateFailed");
        formMessage.className = "form-message error";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = t("dashboard.projectSubmit");
      }
    }
  });
}

function renderProjects(ownerName: string): void {
  if (!projectsList) {
    return;
  }

  renderProjectGrid(projectsList, projects, {
    ownerName,
    tasksPath: getAppContext().routes.tasks,
    search: searchInput?.value || "",
    filter: (document.querySelector(".filter-button.is-active") as HTMLButtonElement | null)?.value as "all" | "active" | "in-review" | "planning" || "all",
    sort: (sortSelect?.value as "newest" | "oldest" | "az") || "newest"
  });
}

function refreshGreeting(): void {
  const today = new Date();
  if (greetingTitle) {
    greetingTitle.textContent = t("dashboard.greetingMorningFallback");
  }
  if (greetingDate) {
    greetingDate.textContent = formatGreetingDate(today);
    greetingDate.dateTime = today.toISOString().slice(0, 10);
  }
}

function showMessage(text: string, type: "error" | "success"): void {
  if (!messageBox) {
    return;
  }

  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
}

function openModal(): void {
  if (!modal) {
    return;
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  (document.getElementById("project-name") as HTMLInputElement | null)?.focus();
}

function closeModal(): void {
  if (!modal) {
    return;
  }

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  form?.reset();
  clearProjectErrors();
}

function readInput(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || "";
}

function setProjectError(id: string, text: string): void {
  const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  const errorBox = document.querySelector(`[data-error-for="${id}"]`) as HTMLElement | null;
  input?.classList.add("input-error");
  if (errorBox) {
    errorBox.textContent = text;
  }
}

function clearProjectErrors(): void {
  if (formMessage) {
    formMessage.textContent = "";
    formMessage.className = "form-message";
  }

  form?.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });

  form?.querySelectorAll(".input-error").forEach((element) => {
    element.classList.remove("input-error");
  });
}

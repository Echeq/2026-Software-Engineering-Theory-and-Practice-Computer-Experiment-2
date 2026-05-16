import "./i18n";
import "../css/dashboard.css";
import { STORAGE_KEYS, t, type SettingState } from "./core/app";
import { getCurrentUser, isSessionError } from "./core/services";
import { setupAppShell } from "./components/app-shell";
import { persistSettingsState, readSettingsState } from "./components/settings-store";

const shell = setupAppShell();
const messageBox = document.getElementById("settings-message");
let settingsState = readSettingsState((document.body.dataset.theme === "dark" ? "dark" : "light"));

void initialize();

async function initialize(): Promise<void> {
  bindControls();

  try {
    const user = await getCurrentUser();
    shell.applyUser(user);

    if (!settingsState.profileName) {
      settingsState.profileName = user.name;
    }

    if (!settingsState.profileEmail) {
      settingsState.profileEmail = user.email;
    }

    persistSettingsState(settingsState);
    renderState();
  } catch (error) {
    if (isSessionError(error)) {
      window.location.href = "/";
      return;
    }

    if (messageBox) {
      messageBox.textContent = error instanceof Error ? error.message : "Failed to load settings.";
      messageBox.className = "form-message error";
    }
  }
}

function bindControls(): void {
  (document.getElementById("settings-name") as HTMLInputElement | null)?.addEventListener("input", (event) => {
    settingsState.profileName = (event.target as HTMLInputElement).value;
    saveAndRender();
  });

  (document.getElementById("settings-email") as HTMLInputElement | null)?.addEventListener("input", (event) => {
    settingsState.profileEmail = (event.target as HTMLInputElement).value;
    saveAndRender();
  });

  document.getElementById("change-password-btn")?.addEventListener("click", () => {
    if (messageBox) {
      messageBox.textContent = t("settings.changePasswordHint");
      messageBox.className = "form-message success";
    }
  });

  document.getElementById("email-notifications-switch")?.addEventListener("click", () => {
    settingsState.emailNotifications = !settingsState.emailNotifications;
    saveAndRender();
  });

  document.getElementById("browser-notifications-switch")?.addEventListener("click", () => {
    settingsState.browserNotifications = !settingsState.browserNotifications;
    saveAndRender();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-project-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.projectView;
      if (view === "grid" || view === "list") {
        settingsState.defaultProjectView = view;
        saveAndRender();
      }
    });
  });

  document.getElementById("appearance-theme-switch")?.addEventListener("click", () => {
    settingsState.theme = settingsState.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = settingsState.theme;
    localStorage.setItem(STORAGE_KEYS.theme, settingsState.theme);
    saveAndRender();
  });

  document.getElementById("clear-local-data-btn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.reload();
  });
}

function saveAndRender(): void {
  persistSettingsState(settingsState);
  renderState();
}

function renderState(): void {
  setInputValue("settings-name", settingsState.profileName);
  setInputValue("settings-email", settingsState.profileEmail);
  setText("appearance-theme-value", settingsState.theme === "dark" ? t("theme.dark") : t("theme.light"));
  renderSwitch("email-notifications-switch", "email-notifications-value", settingsState.emailNotifications);
  renderSwitch("browser-notifications-switch", "browser-notifications-value", settingsState.browserNotifications);

  const appearanceSwitch = document.getElementById("appearance-theme-switch");
  if (appearanceSwitch) {
    appearanceSwitch.setAttribute("aria-checked", String(settingsState.theme === "dark"));
    appearanceSwitch.classList.toggle("is-dark", settingsState.theme === "dark");
  }

  document.querySelectorAll<HTMLButtonElement>("[data-project-view]").forEach((button) => {
    const isActive = button.dataset.projectView === settingsState.defaultProjectView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderSwitch(buttonId: string, valueId: string, isEnabled: boolean): void {
  const button = document.getElementById(buttonId);
  const value = document.getElementById(valueId);

  if (button) {
    button.setAttribute("aria-checked", String(isEnabled));
    button.classList.toggle("is-active", isEnabled);
  }

  if (value) {
    value.textContent = isEnabled ? t("settings.toggleOn") : t("settings.toggleOff");
  }
}

function setInputValue(id: string, value: string): void {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (element) {
    element.value = value;
  }
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

import { STORAGE_KEYS, type SettingState } from "../core/app";

export function readSettingsState(theme: "light" | "dark"): SettingState {
  const raw = localStorage.getItem(STORAGE_KEYS.settings);

  if (!raw) {
    return createDefaultState(theme);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SettingState>;

    if (
      typeof parsed.profileName === "string" &&
      typeof parsed.profileEmail === "string" &&
      typeof parsed.emailNotifications === "boolean" &&
      typeof parsed.browserNotifications === "boolean" &&
      (parsed.defaultProjectView === "grid" || parsed.defaultProjectView === "list") &&
      (parsed.theme === "light" || parsed.theme === "dark")
    ) {
      return parsed as SettingState;
    }
  } catch (_error) {
    return createDefaultState(theme);
  }

  return createDefaultState(theme);
}

export function persistSettingsState(state: SettingState): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state));
}

export function createDefaultState(theme: "light" | "dark"): SettingState {
  return {
    profileName: "",
    profileEmail: "",
    emailNotifications: true,
    browserNotifications: false,
    defaultProjectView: "grid",
    theme
  };
}

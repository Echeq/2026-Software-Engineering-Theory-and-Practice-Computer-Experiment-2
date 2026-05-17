import { STORAGE_KEYS, t } from "./app";

type ThemeMode = "light" | "dark";

export function setupAuthTheme(): void {
  const button = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme: ThemeMode = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;

  applyTheme(theme, button);

  button?.addEventListener("click", () => {
    const nextTheme: ThemeMode = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, button);
  });

  document.addEventListener("app-language-change", () => {
    const activeTheme: ThemeMode = document.body.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(activeTheme, button);
  });
}

function applyTheme(theme: ThemeMode, button: HTMLButtonElement | null): void {
  document.body.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  if (!button) {
    return;
  }

  const isDark = theme === "dark";
  const label = isDark ? t("theme.toLight") : t("theme.toDark");

  button.setAttribute("aria-pressed", String(isDark));
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.classList.toggle("is-dark", isDark);
}

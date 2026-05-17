import { getAppContext, t, STORAGE_KEYS, type User } from "../core/app";
import { getInitials } from "../core/format";
import { logout } from "../core/services";

type ThemeMode = "light" | "dark";

const MOBILE_BREAKPOINT = 960;

export interface AppShell {
  applyUser(user: User): void;
  closeSidebar(): void;
}

export function setupAppShell(): AppShell {
  const userName = document.getElementById("user-name");
  const userAvatar = document.getElementById("user-avatar");
  const themeToggle = document.getElementById("theme-toggle-btn") as HTMLButtonElement | null;
  const logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
  const sidebarToggle = document.getElementById("sidebar-toggle-btn") as HTMLButtonElement | null;
  const sidebar = document.getElementById("dashboard-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  initializeTheme(themeToggle);
  syncSidebar(sidebar, sidebarToggle, backdrop);

  themeToggle?.addEventListener("click", () => {
    const nextTheme: ThemeMode = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, themeToggle);
  });

  logoutButton?.addEventListener("click", async () => {
    await logout();
    window.location.href = getAppContext().routes.login;
  });

  sidebarToggle?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
    syncSidebar(sidebar, sidebarToggle, backdrop);
  });

  backdrop?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.dataset.closeSidebar === "true") {
      closeSidebar(sidebar, sidebarToggle, backdrop);
    }
  });

  window.addEventListener("resize", () => {
    syncSidebar(sidebar, sidebarToggle, backdrop);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar(sidebar, sidebarToggle, backdrop);
    }
  });

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        closeSidebar(sidebar, sidebarToggle, backdrop);
      }
    });
  });

  document.addEventListener("app-language-change", () => {
    const currentTheme = (document.body.dataset.theme === "dark" ? "dark" : "light") as ThemeMode;
    applyTheme(currentTheme, themeToggle);
  });

  return {
    applyUser(user: User): void {
      if (userName) {
        userName.textContent = user.name;
      }

      if (userAvatar) {
        userAvatar.textContent = getInitials(user.name);
      }
    },
    closeSidebar(): void {
      closeSidebar(sidebar, sidebarToggle, backdrop);
    }
  };
}

function initializeTheme(button: HTMLButtonElement | null): void {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme: ThemeMode = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
  applyTheme(theme, button);
}

function applyTheme(theme: ThemeMode, button: HTMLButtonElement | null): void {
  document.body.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  if (!button) {
    return;
  }

  const isDark = theme === "dark";
  button.textContent = isDark ? t("theme.light") : t("theme.dark");
  button.setAttribute("aria-pressed", String(isDark));
  button.setAttribute("aria-label", isDark ? t("theme.toLight") : t("theme.toDark"));
}

function syncSidebar(sidebar: HTMLElement | null, toggle: HTMLButtonElement | null, backdrop: HTMLElement | null): void {
  if (!sidebar || !toggle || !backdrop) {
    return;
  }

  if (window.innerWidth > MOBILE_BREAKPOINT) {
    document.body.classList.remove("sidebar-open");
  }

  const mobileOpen = document.body.classList.contains("sidebar-open");
  const isVisible = window.innerWidth > MOBILE_BREAKPOINT || mobileOpen;
  sidebar.setAttribute("aria-hidden", String(!isVisible));
  toggle.setAttribute("aria-expanded", String(mobileOpen));
  toggle.setAttribute("aria-label", mobileOpen ? "Close navigation menu" : "Open navigation menu");
  backdrop.hidden = !(window.innerWidth <= MOBILE_BREAKPOINT && mobileOpen);
}

function closeSidebar(sidebar: HTMLElement | null, toggle: HTMLButtonElement | null, backdrop: HTMLElement | null): void {
  document.body.classList.remove("sidebar-open");
  syncSidebar(sidebar, toggle, backdrop);
}

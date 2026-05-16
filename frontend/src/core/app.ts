import type { AppContext, Language } from "../types/global";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  taskCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingState {
  profileName: string;
  profileEmail: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
  defaultProjectView: "grid" | "list";
  theme: "light" | "dark";
}

const DEFAULT_CONTEXT: AppContext = {
  pageId: "login",
  routes: {
    login: "/",
    signup: "/signup",
    dashboard: "/dashboard",
    projects: "/dashboard/projects",
    tasks: "/dashboard/tasks",
    settings: "/dashboard/settings",
    apiBase: "/api"
  }
};

export const STORAGE_KEYS = {
  csrfToken: "spmp-csrf-token",
  theme: "dashboard-theme",
  settings: "dashboard-settings-state"
} as const;

export function getAppContext(): AppContext {
  return window.__APP_CONTEXT__ || DEFAULT_CONTEXT;
}

export function t(key: string, values?: Record<string, string | number>): string {
  return window.I18n?.t(key, values) || key;
}

export function getLanguage(): Language {
  return window.I18n?.getLanguage() || "en";
}

export function getLocale(): string {
  const language = getLanguage();

  if (language === "zh") {
    return "zh-CN";
  }

  if (language === "es") {
    return "es-ES";
  }

  return "en-US";
}

export function readCsrfToken(): string {
  return localStorage.getItem(STORAGE_KEYS.csrfToken)?.trim() || "";
}

export function storeCsrfToken(token: string): void {
  if (token.trim()) {
    localStorage.setItem(STORAGE_KEYS.csrfToken, token.trim());
  }
}

export function clearSessionStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.csrfToken);
}

export function getAuthErrorMessage(): string {
  return t("auth.sessionExpired");
}

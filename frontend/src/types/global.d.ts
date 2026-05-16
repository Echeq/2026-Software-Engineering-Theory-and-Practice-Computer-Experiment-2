export type Language = "en" | "zh" | "es";

export interface TranslationApi {
  applyTranslations(root?: ParentNode): void;
  getLanguage(): Language;
  setLanguage(language: Language): void;
  t(key: string, values?: Record<string, string | number>): string;
}

export interface AppContext {
  pageId: "login" | "signup" | "dashboard" | "projects" | "tasks" | "settings";
  routes: {
    login: string;
    signup: string;
    dashboard: string;
    projects: string;
    tasks: string;
    settings: string;
    apiBase: string;
  };
}

declare global {
  interface Window {
    I18n?: TranslationApi;
    __APP_CONTEXT__?: AppContext;
  }
}

export {};

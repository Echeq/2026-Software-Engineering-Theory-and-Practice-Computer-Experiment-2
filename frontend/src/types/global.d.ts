export type Language = "en" | "zh" | "es" | "ru";

export interface TranslationApi {
  applyTranslations(root?: ParentNode): void;
  getLanguage(): Language;
  setLanguage(language: Language): void;
  t(key: string, values?: Record<string, string | number>): string;
}

export interface AppContext {
  pageId: "login" | "dashboard" | "projects" | "tasks" | "settings";
  routes: {
    login: string;
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
    htmx?: {
      trigger(element: Element, eventName: string): void;
    };
    __APP_CONTEXT__?: AppContext;
  }
}

export {};

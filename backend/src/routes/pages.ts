import { Router, Request, Response } from "express";
import { resolveEntryAssets } from "../services/assets";
import { renderNamedTemplate, serializeForScript } from "../services/views";

const router = Router();

const appRoutes = {
  login: "/",
  dashboard: "/dashboard",
  projects: "/dashboard/projects",
  tasks: "/dashboard/tasks",
  settings: "/dashboard/settings",
  apiBase: "/api"
} as const;

router.get(["/", "/index.html"], (_req, res) => {
  renderAuthPage(res, {
    title: "SPMP | Login",
    entry: "src/login.ts",
    heroTitle: "login.title",
    heroSubtitle: "login.subtitle",
    contentTemplate: "partials/auth-login",
    pageClass: "login-page",
    cardClass: "login-card",
    pageId: "login"
  });
});

router.get(["/dashboard", "/dashboard/index.html"], (req, res) => {
  renderWorkspacePage(req, res, {
    pageId: "dashboard",
    title: "SPMP | Dashboard",
    entry: "src/dashboard.ts",
    activePage: "dashboard",
    topbarTagKey: "dashboard.topbarTag",
    topbarLabelKey: "dashboard.topbarLabel",
    contentTemplate: "partials/dashboard-content",
    includeProjectModal: true
  });
});

router.get(["/dashboard/projects", "/dashboard/projects.html"], (req, res) => {
  renderWorkspacePage(req, res, {
    pageId: "projects",
    title: "SPMP | Projects",
    entry: "src/projects.ts",
    activePage: "projects",
    topbarTagKey: "projects.pageTag",
    topbarLabelKey: "projects.topbarLabel",
    contentTemplate: "partials/projects-content"
  });
});

router.get(["/dashboard/tasks", "/dashboard/tasks.html"], (req, res) => {
  renderWorkspacePage(req, res, {
    pageId: "tasks",
    title: "SPMP | Tasks",
    entry: "src/tasks.ts",
    activePage: "tasks",
    topbarTagKey: "tasks.pageTag",
    topbarLabelKey: "tasks.topbarLabel",
    contentTemplate: "partials/tasks-content"
  });
});

router.get(["/dashboard/settings", "/dashboard/settings.html"], (req, res) => {
  renderWorkspacePage(req, res, {
    pageId: "settings",
    title: "SPMP | Settings",
    entry: "src/settings.ts",
    activePage: "settings",
    topbarTagKey: "settings.pageTag",
    topbarLabelKey: "settings.topbarLabel",
    contentTemplate: "partials/settings-content"
  });
});

export default router;

function renderAuthPage(res: Response, options: {
  title: string;
  entry: string;
  heroTitle: string;
  heroSubtitle: string;
  contentTemplate: string;
  pageClass: string;
  cardClass: string;
  pageId: "login";
}): void {
  const assets = resolveEntryAssets(options.entry);
  const content = renderNamedTemplate(options.contentTemplate, {
    routes: appRoutes
  });

  res.render("pages/auth", {
    title: options.title,
    heroTitleKey: options.heroTitle,
    heroSubtitleKey: options.heroSubtitle,
    pageClass: options.pageClass,
    cardClass: options.cardClass,
    content,
    styles: assets.styles,
    scripts: assets.scripts,
    appContextJson: serializeForScript({
      pageId: options.pageId,
      routes: appRoutes
    })
  });
}

function renderWorkspacePage(req: Request, res: Response, options: {
  pageId: "dashboard" | "projects" | "tasks" | "settings";
  title: string;
  entry: string;
  activePage: "dashboard" | "projects" | "tasks" | "settings";
  topbarTagKey: string;
  topbarLabelKey: string;
  contentTemplate: string;
  includeProjectModal?: boolean;
}): void {
  const assets = resolveEntryAssets(options.entry);
  const sidebar = renderNamedTemplate("partials/sidebar", {
    routes: appRoutes,
    activePage: options.activePage
  });
  const topbar = renderNamedTemplate("partials/topbar", {
    tagKey: options.topbarTagKey,
    labelKey: options.topbarLabelKey
  });
  const content = renderNamedTemplate(options.contentTemplate, {
    routes: appRoutes,
    query: req.query
  });
  const extraMarkup = options.includeProjectModal
    ? renderNamedTemplate("partials/project-modal", {})
    : "";

  res.render("pages/app", {
    title: options.title,
    sidebar,
    topbar,
    content,
    extraMarkup,
    styles: assets.styles,
    scripts: assets.scripts,
    appContextJson: serializeForScript({
      pageId: options.pageId,
      routes: appRoutes
    })
  });
}

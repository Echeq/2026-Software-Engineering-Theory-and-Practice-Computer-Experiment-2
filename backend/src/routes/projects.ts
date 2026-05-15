import { Router, Response } from "express";
import { ProjectModel, CreateProjectInput } from "../models/Project";
import { TaskModel } from "../models/Task";
import { AuthRequest } from "../middleware/roleMiddleware";

const router = Router();

type FilterStatus = "all" | "active" | "in-review" | "planning";
type Language = "en" | "zh" | "es";

const fragmentTranslations: Record<Language, Record<string, string>> = {
    en: {
        noProjects: "No projects yet",
        noProjectsText:
            "Try another search or filter, or create a new project.",
        createProject: "Create New Project",
        tasksCount: "{count} tasks",
        createdRecently: "Created recently",
        createdDate: "Created {date}",
        planning: "Planning",
        active: "Active",
        inReview: "In Review",
        done: "Done",
    },
    zh: {
        noProjects: "还没有项目",
        noProjectsText: "尝试其他搜索或筛选条件，或者创建一个新项目。",
        createProject: "创建新项目",
        tasksCount: "{count} 个任务",
        createdRecently: "最近创建",
        createdDate: "创建于 {date}",
        planning: "规划中",
        active: "进行中",
        inReview: "评审中",
        done: "已完成",
    },
    es: {
        noProjects: "Aún no hay proyectos",
        noProjectsText:
            "Prueba otra búsqueda o filtro, o crea un proyecto nuevo.",
        createProject: "Crear nuevo proyecto",
        tasksCount: "{count} tareas",
        createdRecently: "Creado recientemente",
        createdDate: "Creado {date}",
        planning: "Planificación",
        active: "Activo",
        inReview: "En revisión",
        done: "Hecho",
    },
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatStatus(status: string): string {
    return status
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function readLanguage(rawValue: unknown): Language {
    if (rawValue === "zh" || rawValue === "es" || rawValue === "en") {
        return rawValue;
    }

    return "en";
}

function translate(
    language: Language,
    key: string,
    values: Record<string, string | number> = {},
): string {
    const template =
        fragmentTranslations[language][key] ||
        fragmentTranslations.en[key] ||
        key;
    return template.replace(/\{(\w+)\}/g, (_, token: string) =>
        String(values[token] ?? ""),
    );
}

function formatProjectDate(dateString: string, language: Language): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return translate(language, "createdRecently");
    }

    const formattedDate = date.toLocaleDateString(
        language === "zh" ? "zh-CN" : language === "es" ? "es-ES" : "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        },
    );

    return translate(language, "createdDate", { date: formattedDate });
}

function formatStatusLabel(status: string, language: Language): string {
    const normalized = normalizeStatus(status);

    if (normalized === "planning") {
        return translate(language, "planning");
    }

    if (normalized === "active") {
        return translate(language, "active");
    }

    if (normalized === "in-review") {
        return translate(language, "inReview");
    }

    if (
        [
            "done",
            "completed",
            "complete",
            "closed",
            "shipped",
            "finished",
        ].includes(status.trim().toLowerCase())
    ) {
        return translate(language, "done");
    }

    return formatStatus(status);
}

function normalizeStatus(status: string): FilterStatus {
    const value = status.trim().toLowerCase();

    if (["active"].includes(value)) {
        return "active";
    }

    if (["in review", "in-review", "review", "blocked"].includes(value)) {
        return "in-review";
    }

    if (["planning", "planned", "start-next", "queued"].includes(value)) {
        return "planning";
    }

    return "all";
}

function readFilterStatus(rawValue: unknown): FilterStatus {
    if (typeof rawValue !== "string") {
        return "all";
    }

    const normalized = rawValue.trim().toLowerCase();
    if (
        normalized === "active" ||
        normalized === "in-review" ||
        normalized === "planning"
    ) {
        return normalized;
    }

    return "all";
}

function filterProjects(
    projects: ReturnType<typeof ProjectModel.findByOwnerId>,
    searchRaw: unknown,
    status: FilterStatus,
) {
    const search =
        typeof searchRaw === "string" ? searchRaw.trim().toLowerCase() : "";

    return projects.filter((project) => {
        const matchesStatus =
            status === "all" || normalizeStatus(project.status) === status;
        const matchesSearch =
            !search ||
            project.name.toLowerCase().includes(search) ||
            (project.description || "").toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });
}

function renderProjectCards(
    projects: ReturnType<typeof ProjectModel.findByOwnerId>,
    ownerName: string,
    language: Language,
): string {
    if (projects.length === 0) {
        return `
      <article class="state-card empty-state-card">
        <div class="empty-state-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 120" class="empty-state-svg" focusable="false">
            <rect x="26" y="24" width="108" height="72" rx="14"></rect>
            <rect x="42" y="40" width="38" height="8" rx="4"></rect>
            <rect x="42" y="56" width="62" height="6" rx="3"></rect>
            <rect x="42" y="68" width="48" height="6" rx="3"></rect>
            <circle cx="116" cy="52" r="10"></circle>
            <path d="M118 18l6 8"></path>
            <path d="M30 96l10-10"></path>
          </svg>
        </div>
        <h3>${escapeHtml(translate(language, "noProjects"))}</h3>
        <p>${escapeHtml(translate(language, "noProjectsText"))}</p>
        <button type="button" class="submit-button empty-state-action" id="empty-state-create-project-btn">${escapeHtml(translate(language, "createProject"))}</button>
      </article>
    `;
    }

    return projects
        .map((project) => {
            const description = project.description?.trim()
                ? `<p class="project-description">${escapeHtml(project.description.trim())}</p>`
                : '<p class="project-description is-empty">No description yet.</p>';
            const taskCount = TaskModel.findByProjectId(project.id).length;
            const query = new URLSearchParams({
                projectId: project.id,
                projectName: project.name,
                status: formatStatus(project.status),
                creator: ownerName,
                createdAt: project.created_at,
            }).toString();
            const normalizedStatus = project.status.trim().toLowerCase();
            const statusIndicator = getStatusIconMarkup(normalizedStatus);

            return `
      <a class="project-card project-card-link" href="./tasks.html?${query}" data-project-id="${escapeHtml(project.id)}">
        <div class="project-head">
          <div class="project-title-wrap">
            <h3 class="project-name">${escapeHtml(project.name)}</h3>
            <span class="project-task-count">${escapeHtml(translate(language, "tasksCount", { count: taskCount }))}</span>
          </div>
          <span class="project-status">${statusIndicator}${escapeHtml(formatStatusLabel(project.status, language))}</span>
        </div>
        ${description}
        <div class="project-meta">
          <span class="project-owner">${escapeHtml(ownerName)}</span>
          <span>${escapeHtml(formatProjectDate(project.created_at, language))}</span>
        </div>
      </a>
    `;
        })
        .join("");
}

function getStatusIconMarkup(status: string): string {
    if (status === "active") {
        return '<span class="status-indicator" aria-hidden="true"></span><svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 8h2l1.25-3 2 6 1.5-4h3.75" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    if (
        status === "planning" ||
        status === "planned" ||
        status === "start-next" ||
        status === "queued"
    ) {
        return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 5.25V8l1.75 1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    if (
        [
            "done",
            "completed",
            "complete",
            "closed",
            "shipped",
            "finished",
        ].includes(status)
    ) {
        return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 8.1 7.2 9.8l3.3-3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    return "";
}

function attachTaskCounts(
    projects: ReturnType<typeof ProjectModel.findByOwnerId>,
) {
    return projects.map((project) => ({
        ...project,
        taskCount: TaskModel.findByProjectId(project.id).length,
    }));
}

// Get all projects for the authenticated user
router.get("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const projects = ProjectModel.findByOwnerId(req.user.id);
    res.json({ projects: attachTaskCounts(projects) });
});

router.get("/fragment/cards", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).send(`
      <article class="state-card">
        <h3>Session required</h3>
        <p>Please log in again to load your projects.</p>
      </article>
    `);
        return;
    }

    const status = readFilterStatus(req.query.status);
    const language = readLanguage(req.query.lang);
    const projects = ProjectModel.findByOwnerId(req.user.id);
    const filteredProjects = filterProjects(projects, req.query.search, status);

    res.type("html").send(
        renderProjectCards(filteredProjects, req.user.name, language),
    );
});

// Get a single project by ID
router.get("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    // Check ownership
    if (project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    res.json({ project });
});

// Create a new project
router.post("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const { name, description }: CreateProjectInput = req.body;

    if (!name) {
        res.status(400).json({ message: "Project name is required" });
        return;
    }

    const project = ProjectModel.create({
        name,
        description,
        owner_id: req.user.id,
    });

    res.status(201).json({ project });
});

// Update a project
router.put("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const updated = ProjectModel.update(req.params.id, req.body);
    res.json({ project: updated });
});

// Delete a project
router.delete("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    ProjectModel.delete(req.params.id);
    res.json({ message: "Project deleted successfully" });
});

// Get tasks for a project
router.get("/:id/tasks", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const tasks = TaskModel.findByProjectId(req.params.id);
    res.json({ tasks });
});

export default router;

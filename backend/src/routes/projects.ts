import { Router, Response } from "express";
import { ProjectModel, CreateProjectInput } from "../models/Project";
import { UserModel } from "../models/User";
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
        closeProject: "Close",
        deleteProject: "Delete",
        reopenProject: "Reopen",
        noProjectsMember: "No assigned projects",
        noProjectsMemberText: "You don't have any tasks assigned yet. Contact your manager to get assigned to a project.",
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
        closeProject: "关闭",
        deleteProject: "删除",
        reopenProject: "重新打开",
        noProjectsMember: "没有分配的项目",
        noProjectsMemberText: "你还没有被分配任何任务。联系你的管理员来获取工作。",
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
        closeProject: "Cerrar",
        deleteProject: "Eliminar",
        reopenProject: "Reabrir",
        noProjectsMember: "Sin proyectos asignados",
        noProjectsMemberText: "Aún no tienes tareas asignadas. Contacta con tu manager para que te asigne un proyecto.",
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
    userRole?: string,
): string {
    const isMember = userRole === "member";

    if (projects.length === 0) {
        if (isMember) {
            return `
      <article class="state-card empty-state-card">
        <div class="empty-state-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 120" class="empty-state-svg" focusable="false">
            <circle cx="80" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
            <path d="M80 68v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
            <rect x="30" y="84" width="100" height="8" rx="4" fill="currentColor" opacity="0.08"/>
            <rect x="40" y="98" width="80" height="6" rx="3" fill="currentColor" opacity="0.06"/>
          </svg>
        </div>
        <h3>${escapeHtml(translate(language, "noProjectsMember"))}</h3>
        <p>${escapeHtml(translate(language, "noProjectsMemberText"))}</p>
      </article>
    `;
        }
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

    const canManage = userRole === "support" || userRole === "manager";

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
            const isCompleted = ["done", "completed", "complete", "closed", "shipped", "finished"].includes(normalizedStatus);

            const closeAction = isCompleted ? "reopen" : "close";
            const closeLabel = isCompleted ? translate(language, "reopenProject") : translate(language, "closeProject");
            const closeBtn = canManage
                ? `<button type="button" class="secondary-button project-action-btn project-close-btn" data-project-id="${escapeHtml(project.id)}" data-project-name="${escapeHtml(project.name)}" data-action="${escapeHtml(closeAction)}" style="font-size:12px;padding:4px 10px;">${escapeHtml(closeLabel)}</button>`
                : "";

            const deleteBtn = canManage
                ? `<button type="button" class="secondary-button project-action-btn project-delete-btn" data-project-id="${escapeHtml(project.id)}" data-project-name="${escapeHtml(project.name)}" style="font-size:12px;padding:4px 10px;color:var(--danger,#c0392b);">${escapeHtml(translate(language, "deleteProject"))}</button>`
                : "";

            const actionsHtml = closeBtn || deleteBtn
                ? `<div class="project-actions" style="display:flex;gap:6px;margin-top:8px;">${closeBtn}${deleteBtn}</div>`
                : "";

            const statusClass = isCompleted ? "completed" : normalizedStatus;
            return `
      <div class="project-card project-card-link" data-project-id="${escapeHtml(project.id)}" data-project-status="${escapeHtml(statusClass)}">
        <a href="./tasks.html?${query}" class="project-card-inner-link" style="display:block;text-decoration:none;color:inherit;">
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
        ${actionsHtml}
      </div>
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

    // member sees projects they are assigned to; managers/support see owned projects
    if (req.user.role === "member") {
        const allTasks = TaskModel.findByAssignedTo(req.user.id);
        const projectIds = [...new Set(allTasks.map((t) => t.project_id))];
        const projects = projectIds
            .map((pid) => ProjectModel.findById(pid))
            .filter(Boolean) as ReturnType<typeof ProjectModel.findByOwnerId>;
        res.json({ projects: attachTaskCounts(projects) });
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

    let projects: ReturnType<typeof ProjectModel.findByOwnerId>;
    if (req.user.role === "member") {
        const allTasks = TaskModel.findByAssignedTo(req.user.id);
        const projectIds = [...new Set(allTasks.map((t) => t.project_id))];
        projects = projectIds
            .map((pid) => ProjectModel.findById(pid))
            .filter(Boolean) as ReturnType<typeof ProjectModel.findByOwnerId>;
    } else {
        projects = ProjectModel.findByOwnerId(req.user.id);
    }

    const filteredProjects = filterProjects(projects, req.query.search, status);

    res.type("html").send(
        renderProjectCards(filteredProjects, req.user.name, language, req.user.role),
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

    // member can access if assigned to a task in this project
    if (req.user.role === "member") {
        const myTasks = TaskModel.findByAssignedTo(req.user.id);
        const hasAccess = myTasks.some((t) => t.project_id === project.id);
        if (!hasAccess) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        res.json({ project });
        return;
    }

    // Check ownership
    if (project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    res.json({ project });
});

// Create a new project – only support/manager
router.post("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and soporte can create projects" });
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

// Update a project – only support/manager
router.put("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and soporte can update projects" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const updated = ProjectModel.update(req.params.id, req.body);
    res.json({ project: updated });
});

// Close/complete a project – only support/manager
router.patch("/:id/close", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and support can close projects" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const updated = ProjectModel.update(req.params.id, { status: "completed" });
    res.json({ project: updated });
});

// Reopen a closed project – only support/manager
router.patch("/:id/reopen", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and support can reopen projects" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const updated = ProjectModel.update(req.params.id, { status: "active" });
    res.json({ project: updated });
});

// Delete a project – only support/manager
router.delete("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and soporte can delete projects" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);

    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    ProjectModel.delete(req.params.id);
    res.json({ message: "Project deleted successfully" });
});

// Transfer project ownership – only to another manager/support
router.post("/:id/transfer", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Only managers and soporte can transfer projects" });
        return;
    }

    const project = ProjectModel.findById(req.params.id);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const { new_owner_id } = req.body;
    if (!new_owner_id) {
        res.status(400).json({ message: "new_owner_id is required" });
        return;
    }

    const newOwner = UserModel.findById(new_owner_id);
    if (!newOwner) {
        res.status(404).json({ message: "New owner not found" });
        return;
    }

    if (newOwner.role !== "manager" && newOwner.role !== "support") {
        res.status(400).json({ message: "Can only transfer to a manager or soporte" });
        return;
    }

    const updated = ProjectModel.update(req.params.id, { owner_id: new_owner_id });
    res.json({ message: "Project transferred", project: updated });
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

    if (req.user.role === "member") {
        const tasks = TaskModel.findByProjectId(req.params.id);
        res.json({ tasks });
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

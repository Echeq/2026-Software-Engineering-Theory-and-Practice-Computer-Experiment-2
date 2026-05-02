import { Response, Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { Project, ProjectModel } from "../models/Project";
import { Task, TaskModel } from "../models/Task";

type FlashType = "success" | "error";

interface FlashMessage {
  type: FlashType;
  message: string;
}

interface DashboardState {
  flash: FlashMessage | null;
  projectValues: {
    name: string;
    description: string;
  };
  taskValues: {
    title: string;
    description: string;
    priority: string;
    due_date: string;
    project_id: string;
  };
}

interface DashboardViewModel extends DashboardState {
  pageTitle: string;
  projects: Project[];
  tasksByProject: Record<string, Task[]>;
  totalTasks: number;
  completedTasks: number;
}

const DEFAULT_STATE: DashboardState = {
  flash: null,
  projectValues: {
    name: "",
    description: ""
  },
  taskValues: {
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    project_id: ""
  }
};

const router = Router();

function buildDashboardViewModel(req: AuthRequest, state?: Partial<DashboardState>): DashboardViewModel {
  const user = req.currentUser!;
  const projects = ProjectModel.findByOwnerId(user.id);
  const visibleTasks = TaskModel.findVisibleToUser(user.id);

  const tasksByProject = projects.reduce<Record<string, Task[]>>((accumulator, project) => {
    accumulator[project.id] = [];
    return accumulator;
  }, {});

  visibleTasks.forEach((task) => {
    if (!tasksByProject[task.project_id]) {
      tasksByProject[task.project_id] = [];
    }
    tasksByProject[task.project_id].push(task);
  });

  return {
    pageTitle: "Dashboard",
    projects,
    tasksByProject,
    totalTasks: visibleTasks.length,
    completedTasks: visibleTasks.filter((task) => task.status === "completed").length,
    flash: state?.flash ?? DEFAULT_STATE.flash,
    projectValues: state?.projectValues ?? DEFAULT_STATE.projectValues,
    taskValues: state?.taskValues ?? DEFAULT_STATE.taskValues
  };
}

function renderDashboard(req: AuthRequest, res: Response, state?: Partial<DashboardState>, statusCode = 200): void {
  const viewModel = buildDashboardViewModel(req, state);
  res.status(statusCode);

  if (req.get("HX-Request") === "true") {
    res.render("partials/dashboard-content", viewModel);
    return;
  }

  res.render("pages/dashboard", viewModel);
}

router.get("/dashboard", requireAuth, (req: AuthRequest, res: Response) => {
  renderDashboard(req, res);
});

router.get("/dashboard/content", requireAuth, (req: AuthRequest, res: Response) => {
  renderDashboard(req, res);
});

router.post("/projects", requireAuth, (req: AuthRequest, res: Response) => {
  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();

  if (!name) {
    renderDashboard(
      req,
      res,
      {
        flash: { type: "error", message: "Project name is required." },
        projectValues: { name, description }
      },
      400
    );
    return;
  }

  ProjectModel.create({
    name,
    description,
    owner_id: req.currentUser!.id
  });

  renderDashboard(req, res, {
    flash: { type: "success", message: "Project created." }
  });
});

router.post("/projects/:id/delete", requireAuth, (req: AuthRequest, res: Response) => {
  const project = ProjectModel.findById(req.params.id);

  if (!project || project.owner_id !== req.currentUser!.id) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "Project not found." }
    }, 404);
    return;
  }

  ProjectModel.delete(project.id);
  renderDashboard(req, res, {
    flash: { type: "success", message: "Project deleted." }
  });
});

router.post("/tasks", requireAuth, (req: AuthRequest, res: Response) => {
  const project_id = String(req.body.project_id ?? "").trim();
  const title = String(req.body.title ?? "").trim();
  const description = String(req.body.description ?? "").trim();
  const priority = String(req.body.priority ?? "medium").trim().toLowerCase();
  const due_date = String(req.body.due_date ?? "").trim();

  const project = ProjectModel.findById(project_id);
  if (!project || project.owner_id !== req.currentUser!.id) {
    renderDashboard(
      req,
      res,
      {
        flash: { type: "error", message: "Choose a valid project before creating a task." },
        taskValues: { project_id, title, description, priority, due_date }
      },
      400
    );
    return;
  }

  if (!title) {
    renderDashboard(
      req,
      res,
      {
        flash: { type: "error", message: "Task title is required." },
        taskValues: { project_id, title, description, priority, due_date }
      },
      400
    );
    return;
  }

  TaskModel.create({
    project_id,
    title,
    description,
    priority,
    due_date: due_date || undefined
  });

  renderDashboard(req, res, {
    flash: { type: "success", message: "Task created." }
  });
});

router.post("/tasks/:id/status", requireAuth, (req: AuthRequest, res: Response) => {
  const nextStatus = String(req.body.status ?? "").trim();
  const allowedStatuses = new Set(["pending", "in-progress", "completed"]);
  const task = TaskModel.findById(req.params.id);

  if (!task) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "Task not found." }
    }, 404);
    return;
  }

  const project = ProjectModel.findById(task.project_id);
  if (!project || project.owner_id !== req.currentUser!.id) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "You cannot change this task." }
    }, 403);
    return;
  }

  if (!allowedStatuses.has(nextStatus)) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "Unsupported task status." }
    }, 400);
    return;
  }

  TaskModel.update(task.id, { status: nextStatus });
  renderDashboard(req, res, {
    flash: { type: "success", message: "Task updated." }
  });
});

router.post("/tasks/:id/delete", requireAuth, (req: AuthRequest, res: Response) => {
  const task = TaskModel.findById(req.params.id);

  if (!task) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "Task not found." }
    }, 404);
    return;
  }

  const project = ProjectModel.findById(task.project_id);
  if (!project || project.owner_id !== req.currentUser!.id) {
    renderDashboard(req, res, {
      flash: { type: "error", message: "You cannot delete this task." }
    }, 403);
    return;
  }

  TaskModel.delete(task.id);
  renderDashboard(req, res, {
    flash: { type: "success", message: "Task deleted." }
  });
});

export default router;

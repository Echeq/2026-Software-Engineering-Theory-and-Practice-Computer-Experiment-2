import { clearSessionStorage, getAppContext, getAuthErrorMessage, readCsrfToken, storeCsrfToken, type Project, type Task, type User } from "./app";

interface LoginResponse {
  message: string;
  redirectTo?: string;
  csrfToken?: string;
}

interface RegisterResponse {
  message: string;
}

interface UserResponse {
  user: User;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

interface TasksResponse {
  tasks: Task[];
}

interface TaskResponse {
  task: Task;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getAppContext().routes.apiBase}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: buildHeaders(init)
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = readMessage(payload, "Request failed.");
    const error = new ApiError(response.status, message);

    if (response.status === 401 || response.status === 403) {
      clearSessionStorage();
    }

    throw error;
  }

  return payload as T;
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  const method = (init.method || "GET").toUpperCase();

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = readCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return headers;
}

function readMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (response.csrfToken) {
    storeCsrfToken(response.csrfToken);
  }

  return response;
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  return request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", {
      method: "POST"
    });
  } finally {
    clearSessionStorage();
  }
}

export async function getCurrentUser(): Promise<User> {
  const data = await request<UserResponse>("/auth/me");
  return data.user;
}

export async function getProjects(): Promise<Project[]> {
  const data = await request<ProjectsResponse>("/projects");
  return data.projects;
}

export async function createProject(input: { name: string; description?: string }): Promise<Project> {
  const data = await request<ProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.project;
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const data = await request<TasksResponse>(`/projects/${encodeURIComponent(projectId)}/tasks`);
  return data.tasks;
}

export async function createTask(input: {
  title: string;
  description?: string;
  project_id: string;
  priority?: string;
  due_date?: string;
}): Promise<Task> {
  const data = await request<TaskResponse>("/tasks", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return data.task;
}

export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403 || error.message === getAuthErrorMessage());
}

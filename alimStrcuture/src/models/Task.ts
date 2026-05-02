import { v4 as uuidv4 } from "uuid";
import { query, queryOne, run } from "../database";

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

export interface CreateTaskInput {
  title: string;
  description?: string;
  project_id: string;
  assigned_to?: string;
  priority?: string;
  due_date?: string;
}

export class TaskModel {
  static create(input: CreateTaskInput): Task {
    const id = uuidv4();

    run(
      "INSERT INTO tasks (id, title, description, project_id, assigned_to, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        input.title,
        input.description || null,
        input.project_id,
        input.assigned_to || null,
        input.priority || "medium",
        input.due_date || null
      ]
    );

    return this.findById(id)!;
  }

  static findById(id: string): Task | null {
    return queryOne("SELECT * FROM tasks WHERE id = ?", [id]) as Task | null;
  }

  static findByProjectId(projectId: string): Task[] {
    return query("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC", [projectId]) as Task[];
  }

  static findByAssignedTo(userId: string): Task[] {
    return query("SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC", [userId]) as Task[];
  }

  static findVisibleToUser(userId: string): Task[] {
    return query(
      `
        SELECT DISTINCT tasks.*
        FROM tasks
        JOIN projects ON projects.id = tasks.project_id
        WHERE projects.owner_id = ? OR tasks.assigned_to = ?
        ORDER BY tasks.created_at DESC
      `,
      [userId, userId]
    ) as Task[];
  }

  static update(
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "assigned_to">>
  ): Task | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push("priority = ?");
      values.push(updates.priority);
    }
    if (updates.due_date !== undefined) {
      fields.push("due_date = ?");
      values.push(updates.due_date);
    }
    if (updates.assigned_to !== undefined) {
      fields.push("assigned_to = ?");
      values.push(updates.assigned_to);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    run(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, values);

    return this.findById(id);
  }

  static delete(id: string): boolean {
    run("DELETE FROM tasks WHERE id = ?", [id]);
    const task = this.findById(id);
    return task === null;
  }

  static listAll(): Task[] {
    return query("SELECT * FROM tasks ORDER BY created_at DESC") as Task[];
  }
}

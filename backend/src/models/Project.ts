import { v4 as uuidv4 } from "uuid";
import { query, queryOne, run } from "../database";

export interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    owner_id: string;
}

export class ProjectModel {
    static create(input: CreateProjectInput): Project {
        const id = uuidv4();

        run(
            "INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)",
            [id, input.name, input.description || null, input.owner_id],
        );

        return this.findById(id)!;
    }

    static findById(id: string): Project | null {
        return queryOne("SELECT * FROM projects WHERE id = ?", [
            id,
        ]) as Project | null;
    }

    static findByOwnerId(ownerId: string): Project[] {
        return query(
            "SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC",
            [ownerId],
        ) as Project[];
    }

    static update(
        id: string,
        updates: Partial<Pick<Project, "name" | "description" | "status">>,
    ): Project | null {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
            fields.push("name = ?");
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            fields.push("description = ?");
            values.push(updates.description);
        }
        if (updates.status !== undefined) {
            fields.push("status = ?");
            values.push(updates.status);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);

        run(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);

        return this.findById(id);
    }

    static delete(id: string): boolean {
        run("DELETE FROM projects WHERE id = ?", [id]);
        // Check if it was actually deleted
        const project = this.findById(id);
        return project === null;
    }

    static listAll(): Project[] {
        return query(
            "SELECT * FROM projects ORDER BY created_at DESC",
        ) as Project[];
    }
}

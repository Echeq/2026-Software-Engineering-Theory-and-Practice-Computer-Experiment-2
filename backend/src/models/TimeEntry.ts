import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run } from '../database';

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  hours: number;
  date: string;
  created_at: string;
}

export interface CreateTimeEntryInput {
  task_id: string;
  user_id: string;
  description?: string;
  hours: number;
  date: string;
}

export class TimeEntryModel {
  static create(input: CreateTimeEntryInput): TimeEntry {
    const id = uuidv4();
    run(
      'INSERT INTO time_entries (id, task_id, user_id, description, hours, date) VALUES (?, ?, ?, ?, ?, ?)',
      [id, input.task_id, input.user_id, input.description || null, input.hours, input.date]
    );
    return this.findById(id)!;
  }

  static findById(id: string): TimeEntry | null {
    return queryOne('SELECT * FROM time_entries WHERE id = ?', [id]) as TimeEntry | null;
  }

  static findByTaskId(taskId: string): TimeEntry[] {
    return query('SELECT * FROM time_entries WHERE task_id = ? ORDER BY date DESC', [taskId]) as TimeEntry[];
  }

  static findByUserId(userId: string): TimeEntry[] {
    return query('SELECT * FROM time_entries WHERE user_id = ? ORDER BY date DESC', [userId]) as TimeEntry[];
  }

  static delete(id: string): boolean {
    run('DELETE FROM time_entries WHERE id = ?', [id]);
    return this.findById(id) === null;
  }

  static totalHoursByTask(taskId: string): number {
    const rows = query('SELECT SUM(hours) as total FROM time_entries WHERE task_id = ?', [taskId]) as { total: number }[];
    return rows[0]?.total || 0;
  }
}

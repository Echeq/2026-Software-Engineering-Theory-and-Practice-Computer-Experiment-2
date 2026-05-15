import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run } from '../database';

export interface Session {
  id: string;
  user_id: string;
  csrf_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  last_seen_at: string;
  created_at: string;
}

export interface CreateSessionInput {
  user_id: string;
  expires_at: string;
  csrf_token?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface UpdateSessionInput {
  csrf_token?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at?: string;
  last_seen_at?: string;
}

export class SessionModel {
  static create(input: CreateSessionInput): Session {
    const id = uuidv4();

    run(
      `INSERT INTO sessions (id, user_id, csrf_token, ip_address, user_agent, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id,
        input.user_id,
        input.csrf_token ?? null,
        input.ip_address ?? null,
        input.user_agent ?? null,
        input.expires_at
      ]
    );

    return this.findById(id)!;
  }

  static findById(id: string): Session | null {
    return queryOne('SELECT * FROM sessions WHERE id = ?', [id]) as Session | null;
  }

  static findActiveById(id: string): Session | null {
    return queryOne(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP',
      [id]
    ) as Session | null;
  }

  static findByUserId(userId: string): Session[] {
    return query(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as Session[];
  }

  static update(id: string, updates: UpdateSessionInput): Session | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.csrf_token !== undefined) {
      fields.push('csrf_token = ?');
      values.push(updates.csrf_token);
    }
    if (updates.ip_address !== undefined) {
      fields.push('ip_address = ?');
      values.push(updates.ip_address);
    }
    if (updates.user_agent !== undefined) {
      fields.push('user_agent = ?');
      values.push(updates.user_agent);
    }
    if (updates.expires_at !== undefined) {
      fields.push('expires_at = ?');
      values.push(updates.expires_at);
    }
    if (updates.last_seen_at !== undefined) {
      fields.push('last_seen_at = ?');
      values.push(updates.last_seen_at);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    run(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  static touch(id: string): Session | null {
    run('UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    return this.findById(id);
  }

  static delete(id: string): boolean {
    run('DELETE FROM sessions WHERE id = ?', [id]);
    return this.findById(id) === null;
  }

  static deleteByUserId(userId: string): void {
    run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }

  static deleteExpired(): void {
    run('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  }
}

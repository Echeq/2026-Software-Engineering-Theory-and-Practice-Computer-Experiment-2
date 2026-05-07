import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run } from '../database';

export interface Message {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export class MessageModel {
  static create(input: { user_id: string; content: string }): Message {
    const id = uuidv4();
    run('INSERT INTO messages (id, user_id, content) VALUES (?, ?, ?)',
      [id, input.user_id, input.content]);
    return this.findById(id)!;
  }

  static findById(id: string): Message | null {
    const row = queryOne(
      `SELECT m.id, m.user_id, m.content, m.created_at, u.name as user_name
       FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
      [id]
    );
    return row as Message | null;
  }

  static getLast(limit: number): Message[] {
    return query(
      `SELECT m.id, m.user_id, m.content, m.created_at, u.name as user_name
       FROM messages m JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC LIMIT ?`,
      [limit]
    ).reverse() as Message[];
  }
}

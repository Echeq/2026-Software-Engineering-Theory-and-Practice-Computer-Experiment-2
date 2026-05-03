import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../database';

export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export class UserModel {
  private static SALT_ROUNDS = 10;

  static async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);

    run(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, input.name, input.email, hashedPassword]
    );

    return this.findById(id)!;
  }

  static findById(id: string): User | null {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]) as User | null;
  }

  static findByEmail(email: string): User | null {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]) as User | null;
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static listAll(): User[] {
    return query('SELECT id, name, email, role, created_at, updated_at FROM users') as User[];
  }

  static updateRole(id: string, role: UserRole): User | null {
    run(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, id]
    );

    return this.findById(id);
  }
}

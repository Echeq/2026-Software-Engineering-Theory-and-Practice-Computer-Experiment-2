import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../database';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'manager' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: 'manager' | 'member';
}

export class UserModel {
  private static SALT_ROUNDS = 10;

  static async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    const role = input.role ?? 'member';

    run(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, input.name, input.email, hashedPassword, role]
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

  static count(): number {
    const result = queryOne('SELECT COUNT(*) as count FROM users');
    return result ? Number(result.count) : 0;
  }

  static listAll(): User[] {
    return query('SELECT id, name, email, role, created_at, updated_at FROM users') as User[];
  }
}

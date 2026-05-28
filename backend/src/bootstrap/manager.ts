import { UserModel } from '../models/User';

export async function ensureManagerUser(): Promise<void> {
  const existing = UserModel.listAll();
  if (existing.length > 0) return;

  const name = process.env.MANAGER_NAME || 'System Manager';
  const email = process.env.MANAGER_EMAIL;
  const password = process.env.MANAGER_PASSWORD;

  if (!email || !password) {
    console.warn('No users exist and MANAGER_EMAIL/MANAGER_PASSWORD are not set in .env — skipping seed.');
    return;
  }

  const user = await UserModel.create({ name, email, password });
  UserModel.updateRole(user.id, 'manager');
  console.log(`Manager account created: ${email}`);
}

import { UserModel } from '../models/User';

export async function ensureManagerUser(): Promise<void> {
  const email = process.env.MANAGER_EMAIL?.trim().toLowerCase();
  const password = process.env.MANAGER_PASSWORD?.trim();
  const name = process.env.MANAGER_NAME?.trim() || 'System Manager';

  if (!email || !password) {
    console.warn('Manager bootstrap skipped: MANAGER_EMAIL or MANAGER_PASSWORD is missing');
    return;
  }

  const existingUser = UserModel.findByEmail(email);

  if (!existingUser) {
    const createdUser = await UserModel.create({ name, email, password });
    UserModel.updateRole(createdUser.id, 'manager');
    console.log(`Manager account created for ${email}`);
    return;
  }

  if (existingUser.role !== 'manager') {
    UserModel.updateRole(existingUser.id, 'manager');
    console.log(`Existing user promoted to manager: ${email}`);
    return;
  }

  console.log(`Manager account already configured: ${email}`);
}

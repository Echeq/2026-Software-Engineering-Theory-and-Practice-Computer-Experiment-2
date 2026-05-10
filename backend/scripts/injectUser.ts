import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { closeDatabase, getDatabase, run } from '../src/database';
import { UserModel, UserRole } from '../src/models/User';

type EnvUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type RawEnvUser = Partial<EnvUser>;

const SALT_ROUNDS = 10;

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

function normalizeUser(rawUser: RawEnvUser, fallbackRole: UserRole): EnvUser | null {
  const email = rawUser.email?.trim().toLowerCase();
  const password = rawUser.password?.trim();
  const name = rawUser.name?.trim() || email?.split('@')[0] || 'User';
  const role = rawUser.role === 'manager' ? 'manager' : fallbackRole;

  if (!email || !password) {
    return null;
  }

  return { name, email, password, role };
}

function readUsersFromEnv(): EnvUser[] {
  const configuredUsers: EnvUser[] = [];

  const managerUser = normalizeUser(
    {
      name: process.env.MANAGER_NAME,
      email: process.env.MANAGER_EMAIL,
      password: process.env.MANAGER_PASSWORD,
      role: 'manager',
    },
    'manager'
  );

  if (managerUser) {
    configuredUsers.push(managerUser);
  }

  const defaultUser = normalizeUser(
    {
      name: process.env.USER_NAME,
      email: process.env.USER_EMAIL,
      password: process.env.USER_PASSWORD,
      role: process.env.USER_ROLE as UserRole | undefined,
    },
    'user'
  );

  if (defaultUser) {
    configuredUsers.push(defaultUser);
  }

  const usersJson = process.env.USERS_JSON?.trim();
  if (usersJson) {
    const parsedUsers = JSON.parse(usersJson);

    if (!Array.isArray(parsedUsers)) {
      throw new Error('USERS_JSON must be a JSON array');
    }

    for (const parsedUser of parsedUsers) {
      const user = normalizeUser(parsedUser, 'user');
      if (user) {
        configuredUsers.push(user);
      }
    }
  }

  const deduplicatedUsers = new Map<string, EnvUser>();
  for (const user of configuredUsers) {
    deduplicatedUsers.set(user.email, user);
  }

  return [...deduplicatedUsers.values()];
}

async function upsertUser(user: EnvUser): Promise<'created' | 'updated'> {
  const existingUser = UserModel.findByEmail(user.email);
  const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

  if (!existingUser) {
    run(
      `
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `,
      [uuidv4(), user.name, user.email, passwordHash, user.role]
    );

    return 'created';
  }

  run(
    `
      UPDATE users
      SET name = ?, password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `,
    [user.name, passwordHash, user.role, user.email]
  );

  return 'updated';
}

async function main(): Promise<void> {
  const users = readUsersFromEnv();

  if (users.length === 0) {
    throw new Error(
      'No users configured. Set MANAGER_EMAIL/MANAGER_PASSWORD, USER_EMAIL/USER_PASSWORD, or USERS_JSON in backend/.env'
    );
  }

  await getDatabase();

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of users) {
    const action = await upsertUser(user);

    if (action === 'created') {
      createdCount += 1;
    } else {
      updatedCount += 1;
    }

    console.log(`${action.toUpperCase()}: ${user.email} (${user.role})`);
  }

  console.log(`User injection complete. Created: ${createdCount}, Updated: ${updatedCount}`);
}

main()
  .catch((error) => {
    console.error('Failed to inject users:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    closeDatabase();
  });

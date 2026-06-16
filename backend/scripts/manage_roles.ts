import path from 'path';
import initSqlJs from 'sql.js';
import fs from 'fs';
import * as readline from 'readline';

const DB_PATH = path.join(__dirname, '../data/spmp.db');

const VALID_ROLES = ['support', 'manager', 'member'] as const;
type Role = typeof VALID_ROLES[number];

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

function ensureDbExists(): void {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    console.error('Start the server first to create the database.');
    process.exit(1);
  }
}

async function openDb() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  return db;
}

function saveDb(db: any): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function listUsers(db: any): UserRow[] {
  const stmt = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name');
  const users: UserRow[] = [];
  while (stmt.step()) {
    users.push(stmt.getAsObject() as unknown as UserRow);
  }
  stmt.free();
  return users;
}

function countByRole(db: any, role: string): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
  stmt.bind([role]);
  let count = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { count: number };
    count = row.count;
  }
  stmt.free();
  return count;
}

function changeUserRole(db: any, userId: string, newRole: Role): boolean {
  const stmt = db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.bind([newRole, userId]);
  stmt.step();
  stmt.free();
  saveDb(db);
  return true;
}

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function printUsers(users: UserRow[]): void {
  console.log('\n── Users ─────────────────────────────────────────────');
  console.log('  #  │ Name                      │ Email                         │ Role       │ Joined');
  console.log('─────┼───────────────────────────┼───────────────────────────────┼────────────┼──────────────');
  users.forEach((u, i) => {
    const idx = String(i + 1).padStart(3);
    const name = u.name.padEnd(26).slice(0, 26);
    const email = u.email.padEnd(30).slice(0, 30);
    const role = u.role.padEnd(10).slice(0, 10);
    const joined = u.created_at?.slice(0, 10) || 'unknown';
    console.log(`  ${idx} │ ${name} │ ${email} │ ${role} │ ${joined}`);
  });
  console.log('─────────────────────────────────────────────────────────────────────────────────');
}

function printRoleCounts(db: any): void {
  console.log(`  support: ${countByRole(db, 'support')}  |  manager: ${countByRole(db, 'manager')}  |  member: ${countByRole(db, 'member')}`);
}

async function main(): Promise<void> {
  ensureDbExists();

  const db = await openDb();
  let exit = false;

  console.log('\n═══════════════════════════════════════════════');
  console.log('  SPMP Role Management CLI');
  console.log('  Connected to: backend/data/spmp.db');
  console.log('═══════════════════════════════════════════════\n');

  while (!exit) {
    const users = listUsers(db);
    printUsers(users);
    printRoleCounts(db);

    console.log('\nCommands:');
    console.log('  <number>  - Select user by number to change role');
    console.log('  q         - Quit');

    const answer = await prompt('\n> ');

    if (answer.toLowerCase() === 'q') {
      exit = true;
      continue;
    }

    const idx = parseInt(answer, 10);
    if (isNaN(idx) || idx < 1 || idx > users.length) {
      console.log('  Invalid selection. Enter a number from the list or "q" to quit.');
      continue;
    }

    const selectedUser = users[idx - 1];
    console.log(`\n  Selected: ${selectedUser.name} <${selectedUser.email}> (current role: ${selectedUser.role})`);

    console.log('\n  Available roles:');
    console.log('    1 - support');
    console.log('    2 - manager');
    console.log('    3 - member');
    console.log('    c - Cancel');

    const roleAnswer = await prompt('\n  New role (1/2/3/c): ');

    if (roleAnswer.toLowerCase() === 'c') {
      console.log('  Cancelled.\n');
      continue;
    }

    const roleMap: Record<string, Role> = { '1': 'support', '2': 'manager', '3': 'member' };
    const newRole = roleMap[roleAnswer];

    if (!newRole) {
      console.log('  Invalid choice.\n');
      continue;
    }

    if (newRole === selectedUser.role) {
      console.log(`  User already has role "${newRole}". No change needed.\n`);
      continue;
    }

    // Prevent removing the last support
    if (selectedUser.role === 'support' && newRole !== 'support') {
      const supportCount = countByRole(db, 'support');
      if (soporteCount <= 1) {
        console.log('  ERROR: Cannot remove the last support user. Create another support first.\n');
        continue;
      }
    }

    changeUserRole(db, selectedUser.id, newRole);
    console.log(`  ✓ Role updated: ${selectedUser.name} is now "${newRole}"\n`);
  }

  db.close();
  console.log('Goodbye!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

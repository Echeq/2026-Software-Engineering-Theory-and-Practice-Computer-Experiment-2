import { getDatabase, query, closeDatabase } from './src/database';

async function main() {
  await getDatabase();
  console.log('Users:', JSON.stringify(query('SELECT id, name, email, role FROM users')));
  console.log('Projects:', JSON.stringify(query('SELECT id, name, status FROM projects')));
  console.log('Tasks:', JSON.stringify(query('SELECT id, title, status, priority FROM tasks')));
  closeDatabase();
}
main();

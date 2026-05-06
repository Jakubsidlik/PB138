import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, connection } from './src/db/client.js';

async function run() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully!');
  } catch (err: any) {
    console.error('Error running migrations:', err.message);
  }
  process.exit(0);
}
run();

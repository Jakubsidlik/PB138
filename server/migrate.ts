import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './src/db/client';

async function run() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('Error running migrations:', err.message);
    process.exit(1);
  }
}
run();

import { db } from './src/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Adding PUBLIC value to UserRole enum...');
    await db.execute(sql.raw('ALTER TYPE "UserRole" ADD VALUE \'PUBLIC\''));
    console.log("MIGRATION APPLIED SUCCESSFULLY");
  } catch (e: any) {
    console.error("FULL ERROR:", e);
  }
  process.exit(0);
}

main();

import { db } from './src/db/client.js'
import { users } from './src/db/schema.js'
import { eq } from 'drizzle-orm'

async function run() {
  try {
    const res = await db.select().from(users).where(eq(users.id, 1n)).limit(1);
    console.log("Drizzle Query success:", res);
  } catch (err: any) {
    console.log("Drizzle Query error:", err.message);
  }
  process.exit(0);
}
run();

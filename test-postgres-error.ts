import { db } from './src/db/client.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    await db.execute(sql`select "id", "fullName", "email", "role", "school", "faculty", "studyMajor", "studyYear", "studyType", "birthDate", "bio", "avatarDataUrl", "contactEmail", "updatedAt" from "User" limit 1`);
    console.log("Query 1 success");
  } catch (err) {
    console.log("Query 1 error:", err.message);
  }
  process.exit(0);
}
run();

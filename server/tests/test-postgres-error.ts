import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    await sql`select "id", "fullName", "email", "role", "school", "faculty", "studyMajor", "studyYear", "studyType", "birthDate", "bio", "avatarDataUrl", "contactEmail", "updatedAt" from "User" where "User"."id" = 1 limit 1`;
    console.log("Query 1 success");
  } catch (err: any) {
    console.log("Query 1 error:", err.message);
  }
  process.exit(0);
}
run();

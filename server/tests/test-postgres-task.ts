import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    await sql`insert into "Task" ("id", "userId", "subjectId", "studyPlanId", "title", "done", "favorite", "tag", "deadline", "deletedAt", "createdAt", "updatedAt") values (default, 1, default, default, 'x', false, default, default, default, default, default, default)`;
    console.log("Query success");
  } catch (err: any) {
    console.log("Query error:", err.message);
  }
  process.exit(0);
}
run();

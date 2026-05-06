import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const tables = ['User', 'Event', 'FileComment', 'FileRecord', 'FileShare', 'LessonNote', 'Lesson', 'StudyPlanCollaborator', 'StudyPlan', 'Subject', 'Task', 'TextAnnotation'];
    
    for (const table of tables) {
      try {
        const query = `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max("id"), 1), max("id") IS NOT null) FROM "${table}";`;
        await sql.unsafe(query);
        console.log(`Reset sequence for ${table}`);
      } catch (e: any) {
        console.log(`Could not reset sequence for ${table}:`, e.message);
      }
    }
    console.log("Sequences reset successfully!");
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  process.exit(0);
}
run();

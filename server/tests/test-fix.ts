import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    console.log("Applying ALTER TABLE statements...");
    
    // Fix User table
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contactEmail" text;`;
    await sql`ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();`;
    
    // Fix FileRecord table
    await sql`ALTER TABLE "FileRecord" ALTER COLUMN "updatedAt" SET DEFAULT now();`;
    
    // Let's check other tables for missing defaults on updatedAt or createdAt
    const tables = ['Event', 'FileComment', 'FileShare', 'LessonNote', 'Lesson', 'StudyPlanCollaborator', 'StudyPlan', 'Subject', 'Task', 'TextAnnotation'];
    for (const table of tables) {
      try { await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN "updatedAt" SET DEFAULT now()`); } catch(e) {}
      try { await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN "createdAt" SET DEFAULT now()`); } catch(e) {}
    }

    console.log("Fixes applied successfully!");
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  process.exit(0);
}
run();

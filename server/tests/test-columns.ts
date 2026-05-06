import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const userCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'User'`;
    console.log("User columns:", userCols.map(c => c.column_name).join(', '));
    const fileCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'FileRecord'`;
    console.log("FileRecord columns:", fileCols.map(c => c.column_name).join(', '));
  } catch (err: any) {
    console.log("Query error:", err.message);
  }
  process.exit(0);
}
run();

import { db } from './src/db/client.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
  try {
    const sqlContent = fs.readFileSync('./drizzle/0011_curvy_molly_hayes.sql', 'utf-8');
    const statements = sqlContent.split('--> statement-breakpoint');
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim());
        await db.execute(sql.raw(statement.trim()));
      }
    }
    console.log("MIGRATION APPLIED SUCCESSFULLY");
  } catch (e: any) {
    console.error("FULL ERROR:", e);
  }
  process.exit(0);
}

main();

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function run() {
  try {
    const sqlContent = fs.readFileSync('drizzle/0006_fixed_odin.sql', 'utf8');
    const statements = sqlContent.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log('Executing:', trimmed);
        await client.unsafe(trimmed);
      }
    }
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();

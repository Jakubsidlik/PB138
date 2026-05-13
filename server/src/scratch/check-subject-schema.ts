import { db } from '../db/client.js'
import { sql } from 'drizzle-orm'

async function main() {
  const result = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'Subject';
  `)
  console.log('Schéma tabulky Subject:', result)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

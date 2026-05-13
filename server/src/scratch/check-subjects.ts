import { db } from '../db/client.js'
import { subjects } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

async function main() {
  const userSubjects = await db.select().from(subjects).where(eq(subjects.userId, 1n))
  console.log('Předměty uživatele 1:', userSubjects)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

import { db } from '../db/client.js'
import { users } from '../db/schema.js'

async function main() {
  const allUsers = await db.select().from(users)
  console.log('Existující uživatelé:', allUsers)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

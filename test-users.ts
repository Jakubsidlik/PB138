import { db } from './server/src/db/client.js'
import { users } from './server/src/db/schema.js'

async function run() {
  const allUsers = await db.select().from(users)
  console.log(allUsers)
  process.exit(0)
}
run()

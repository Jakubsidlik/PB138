import { db } from '../db/client.js'
import { studyPlans } from '../db/schema.js'

async function main() {
  const plans = await db.select().from(studyPlans)
  console.log('Existující studijní plány:', plans)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

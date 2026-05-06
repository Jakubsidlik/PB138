import { db } from './src/db/client.js'
import { fileRecords, fileShares } from './src/db/schema.js'
import { eq, or, isNull, sql } from 'drizzle-orm'

async function run() {
  try {
    const actor = { id: 18 }
    const explicitShares = db.select({ fileId: fileShares.fileId }).from(fileShares).where(eq(fileShares.userId, BigInt(actor.id)))

    const query = db.select().from(fileRecords).where(
      or(
        eq(fileRecords.userId, BigInt(actor.id)),
        eq(fileRecords.isShared, true),
        sql`${fileRecords.id} IN ${explicitShares}`
      )
    )

    await query
    console.log("Success")
  } catch (err: any) {
    console.error("ERROR:")
    console.error(err)
    if (err.cause) console.error("CAUSE:", err.cause)
  }
  process.exit(0)
}
run()

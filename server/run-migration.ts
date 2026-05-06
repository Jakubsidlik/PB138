import { db } from './src/db/client.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "FileShare" (
        "fileId" bigint NOT NULL,
        "userId" bigint NOT NULL,
        "permission" text DEFAULT 'read' NOT NULL,
        "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "FileShare_fileId_userId_pk" PRIMARY KEY("fileId","userId")
      );
      CREATE INDEX IF NOT EXISTS "FileShare_fileId_idx" ON "FileShare" USING btree ("fileId");
      CREATE INDEX IF NOT EXISTS "FileShare_userId_idx" ON "FileShare" USING btree ("userId");
    `)
    console.log("Migration applied successfully.")
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}
run()

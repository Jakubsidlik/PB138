import postgres from 'postgres'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL ?? ''
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = postgres(connectionString, { max: 1 })

async function migrate() {
  try {
    console.log('Adding isArchived column to Subject table...')
    await sql`ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE`
    console.log('Successfully added isArchived column.')
    
    console.log('Migrating existing archived subjects (deletedAt is not null)...')
    await sql`UPDATE "Subject" SET "isArchived" = TRUE WHERE "deletedAt" IS NOT NULL`
    await sql`UPDATE "Subject" SET "deletedAt" = NULL WHERE "isArchived" = TRUE`
    console.log('Migration complete.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await sql.end()
  }
}

migrate()

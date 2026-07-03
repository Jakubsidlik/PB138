import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const url = process.env.DATABASE_URL || ''
const sql = postgres(url, { max: 1, connect_timeout: 30, ssl: 'require' })

async function run() {
  try {
    console.log('Adding missing columns to User table...')

    const statements = [
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "school" text`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyMajor" text`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyYear" text`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyType" text`,
    ]

    for (const stmt of statements) {
      await sql.unsafe(stmt)
      console.log(`  ✅ ${stmt}`)
    }

    // Verify
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'User' ORDER BY ordinal_position`
    console.log('\nUser columns now:', cols.map((c: any) => c.column_name).join(', '))
    console.log('\n🎉 Done! Server should work now.')
  } catch (err: any) {
    console.error('Error:', err.message)
  } finally {
    await sql.end()
  }
}
run()

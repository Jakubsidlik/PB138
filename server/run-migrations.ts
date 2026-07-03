import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

// Use pooler URL (direct URL fails on IPv6-only networks)
const url = process.env.DATABASE_URL || ''
console.log('Connecting to:', url.replace(/:[^:@]+@/, ':***@'))

const sql = postgres(url, { max: 1, connect_timeout: 30, ssl: 'require' })

const MIGRATIONS_DIR = path.resolve(currentDir, 'drizzle')

async function run() {
  try {
    // Create migrations tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS "_migrations_applied" (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    console.log('✅ Migration tracking table ready')

    // Get already applied migrations
    const applied = await sql`SELECT name FROM _migrations_applied`
    const appliedSet = new Set(applied.map((r: any) => r.name))

    // Get all SQL migration files sorted
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`Found ${files.length} migration files, ${appliedSet.size} already applied`)

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭️  Skipping (already applied): ${file}`)
        continue
      }

      console.log(`⚡ Applying: ${file}`)
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')

      // Split by statement-breakpoint and execute each statement
      const statements = content
        .split('--> statement-breakpoint')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      for (const stmt of statements) {
        try {
          await sql.unsafe(stmt)
        } catch (err: any) {
          // Ignore "already exists" errors
          if (err.message?.includes('already exists') || err.code === '42710' || err.code === '42P07' || err.code === '42701') {
            console.log(`  ⚠️  Skipped (already exists): ${stmt.substring(0, 60).replace(/\n/g, ' ')}...`)
          } else {
            throw new Error(`Failed in ${file}: ${err.message}\nStatement: ${stmt.substring(0, 100)}`)
          }
        }
      }

      // Mark as applied
      await sql`INSERT INTO _migrations_applied (name) VALUES (${file}) ON CONFLICT DO NOTHING`
      console.log(`✅ Applied: ${file}`)
    }

    console.log('\n🎉 All migrations applied successfully!')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

run()

import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const url = process.env.DATABASE_URL || ''
console.log('Connecting via pooler:', url.replace(/:[^:@]+@/, ':***@'))

const sql = postgres(url, { max: 1, connect_timeout: 30, ssl: 'require' })

async function run() {
  try {
    const schemaFile = path.resolve(currentDir, 'supabase-schema.sql')
    const content = fs.readFileSync(schemaFile, 'utf-8')

    // Split on semicolons to get individual statements
    const statements = content
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} statements...`)

    let ok = 0
    let skipped = 0
    let failed = 0

    for (const stmt of statements) {
      // Skip pure comment blocks
      const cleanStmt = stmt.replace(/--.*$/gm, '').trim()
      if (!cleanStmt) { skipped++; continue }

      try {
        await sql.unsafe(cleanStmt)
        ok++
        // Show what was created
        const firstLine = cleanStmt.split('\n')[0].substring(0, 70)
        if (firstLine.includes('CREATE') || firstLine.includes('INSERT')) {
          console.log(`  ✅ ${firstLine}`)
        }
      } catch (err: any) {
        const msg = err.message || ''
        if (msg.includes('already exists') || err.code === '42710' || err.code === '42P07' || err.code === '42701') {
          skipped++
        } else {
          failed++
          console.error(`  ❌ FAILED: ${cleanStmt.substring(0, 80)}`)
          console.error(`     Error: ${msg}`)
        }
      }
    }

    console.log(`\n📊 Results: ${ok} created, ${skipped} skipped (already existed), ${failed} failed`)

    // Verify Car-Y-list tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('Group', 'GroupMember', 'Image', 'ImageRating', 'ImageComment', 'User')
      ORDER BY table_name
    `
    console.log('\n🔍 Car-Y-list tables in DB:', tables.map((t: any) => t.table_name).join(', '))

    if (tables.length === 6) {
      console.log('🎉 All required tables exist! Server should work now.')
    } else {
      console.log('⚠️  Some tables missing:', ['Group', 'GroupMember', 'Image', 'ImageRating', 'ImageComment', 'User'].filter(
        t => !tables.map((r: any) => r.table_name).includes(t)
      ).join(', '))
    }
  } catch (err: any) {
    console.error('Fatal error:', err.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

run()

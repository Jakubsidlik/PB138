import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const url = process.env.DATABASE_URL ?? ''
console.log('Connecting to:', url.replace(/:[^:@]+@/, ':***@'))

const sql = postgres(url, { max: 1, connect_timeout: 15 })
try {
  const result = await sql`SELECT current_database() as db, now() as ts`
  console.log('✅ Connected successfully:', JSON.stringify(result))

  // Check if Group table exists
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  console.log('Tables in DB:', tables.map((t: any) => t.table_name).join(', '))
} catch (err: any) {
  console.error('❌ Connection failed:', err.message)
} finally {
  await sql.end()
}

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
    // Tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name`
    console.log('Tables:', tables.map((t: any) => t.table_name).join(', '))

    // User columns
    const userCols = await sql`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' ORDER BY ordinal_position`
    console.log('\nUser columns:')
    for (const c of userCols) {
      console.log(`  ${c.column_name}: ${c.udt_name} (nullable: ${c.is_nullable})`)
    }

    // Enums
    const enums = await sql`
      SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname`
    console.log('\nEnums:', enums.map((e: any) => e.typname).join(', '))

    // Check GroupMember role column type
    const gmCols = await sql`
      SELECT column_name, udt_name FROM information_schema.columns 
      WHERE table_name = 'GroupMember'`
    console.log('\nGroupMember columns:', gmCols.map((c: any) => `${c.column_name}(${c.udt_name})`).join(', '))

  } catch (err: any) {
    console.error('Error:', err.message)
  } finally {
    await sql.end()
  }
}
run()

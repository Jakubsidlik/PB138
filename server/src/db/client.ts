import dotenv from 'dotenv'
import path from 'path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from './schema'

dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const connectionString = process.env.DATABASE_URL ?? ''

const client = postgres(connectionString, {
  max: 10,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
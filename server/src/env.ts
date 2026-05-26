import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

dotenv.config()
const currentDir = path.dirname(fileURLToPath(import.meta.url)) 
dotenv.config({ path: path.resolve(currentDir, '../.env') })

export const envSchema = z.object({
  PORT: z.string().optional().default('5000').transform(Number),
  S3_REGION: z.string().optional().default('eu-west-1'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional().default(''),
  S3_SECRET_KEY: z.string().optional().default(''),
  S3_BUCKET_NAME: z.string().optional().default('pb138-bucket'),
  RESEND_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
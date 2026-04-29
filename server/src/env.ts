import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

export const envSchema = z.object({
  PORT: z.string().optional().default('5000').transform(Number),
  S3_REGION: z.string().optional().default('eu-west-1'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional().default(''), // Default fallback pro vývoj bez S3
  S3_SECRET_KEY: z.string().optional().default(''),
  S3_BUCKET_NAME: z.string().optional().default('pb138-bucket'),
})

export const env = envSchema.parse(process.env)
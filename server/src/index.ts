import cors from 'cors'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { sql } from 'drizzle-orm'
import { db } from './db/client'
import { env } from './env'
import { usersRouter } from './modules/users/users.routes'
import { filesRouter, adminFilesRouter } from './modules/files/files.routes'
import { groupsRouter } from './modules/groups/groups.routes'
import { imagesRouter } from './modules/images/images.routes'
import { commentsRouter } from './modules/comments/comments.routes'
import { ratingsRouter } from './modules/ratings/ratings.routes'
import { errorHandler } from './middleware/error-handler'

export const app = express()
const PORT = env.PORT

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
)

// ── Car-Y-list routes ─────────────────────────────────────────────────
app.use('/api/groups', groupsRouter)
app.use('/api/groups', imagesRouter)
app.use('/api/groups/:id/images/:imageId/comments', commentsRouter)
app.use('/api/groups/:id', ratingsRouter)

// ── Preserved routes ──────────────────────────────────────────────────
app.use('/api/files', filesRouter)
app.use('/api/admin/files', adminFilesRouter)
app.use('/api', usersRouter)

app.get('/api/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({ status: 'OK', message: 'Car-Y-list server běží', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'Databáze není dostupná' })
  }
})

app.use(errorHandler)

const start = async () => {
  app.listen(PORT, () => {
    console.log(`Car-Y-list server běží na http://localhost:${PORT}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  void start()
}

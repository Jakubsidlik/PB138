import cors from 'cors'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { sql } from 'drizzle-orm'
import { db } from './db/client.js'
import { env } from './env.js'
import { tasksRouter } from './modules/tasks/tasks.routes.js'
import { eventsRouter } from './modules/events/events.routes.js'
import { studyPlansRouter } from './modules/study-plans/study-plans.routes.js'
import { subjectsRouter } from './modules/subjects/subjects.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { filesRouter, adminFilesRouter } from './modules/files/files.routes.js'
import { lessonsRouter } from './modules/lessons/lessons.routes.js'
import { errorHandler } from './middleware/error-handler.js'

export const app = express()
const PORT = env.PORT

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(clerkMiddleware())

app.use('/api/tasks', tasksRouter)
app.use('/api/events', eventsRouter)
app.use('/api/study-plans', studyPlansRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/files', filesRouter)
app.use('/api/admin/files', adminFilesRouter)
app.use('/api/lessons', lessonsRouter)
app.use('/api', usersRouter)

app.get('/api/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({ status: 'OK', message: 'Server bezi', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'Databaze neni dostupna' })
  }
})

// Users routes moved to src/users/users.routes.ts

// Global error handler middleware
app.use(errorHandler)

const start = async () => {
  app.listen(PORT, () => {
    console.log(`Server bezi na http://localhost:${PORT}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  void start()
}

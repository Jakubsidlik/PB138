import cors from 'cors'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { sql } from 'drizzle-orm'
import { db } from './db/client'
import { env } from './env'
import { tasksRouter } from './modules/tasks/tasks.routes'
import { eventsRouter } from './modules/events/events.routes'
import { studyPlansRouter } from './modules/study-plans/study-plans.routes'
import { subjectsRouter } from './modules/subjects/subjects.routes'
import { usersRouter } from './modules/users/users.routes'
import { filesRouter, adminFilesRouter } from './modules/files/files.routes'
import { lessonsRouter } from './modules/lessons/lessons.routes'
import { tagsRouter } from './modules/tags/tags.routes'
import { errorHandler } from './middleware/error-handler'

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
app.use('/api/tags', tagsRouter)
app.use('/api', usersRouter)

app.get('/api/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({ status: 'OK', message: 'Server bezi', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'Databaze neni dostupna' })
  }
})

app.use(errorHandler)

const start = async () => {
  app.listen(PORT, () => {
    console.log(`Server bezi na http://localhost:${PORT}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  void start()
}

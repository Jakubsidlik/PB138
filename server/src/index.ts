import cors from 'cors'
import express from 'express'
import { clerkMiddleware } from '@clerk/express'
import { type UserRole } from './db/schema.js'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { db } from './db/client.js'
import { users } from './db/schema.js'
import { profileSchema, updateProfileSchema } from './schemas.js'
import { toDateOnlyIso, parseOptionalDate } from './utils.js'
import { requireRegisteredActor, requireAdmin } from './auth.js'
import { env } from './env.js'
import { tasksRouter } from './modules/tasks/tasks.routes.js'
import { eventsRouter } from './modules/events/events.routes.js'
import { studyPlansRouter } from './modules/study-plans/study-plans.routes.js'
import { subjectsRouter } from './modules/subjects/subjects.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { filesRouter, adminFilesRouter, fileCommentsRouter } from './modules/files/files.routes.js'
import { lessonsRouter, lessonNotesRouter, annotationsRouter } from './modules/lessons/lessons.routes.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()
const PORT = env.PORT

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api/tasks', tasksRouter)
app.use('/api/events', eventsRouter)
app.use('/api/study-plans', studyPlansRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/files', filesRouter)
app.use('/api/admin/files', adminFilesRouter)
app.use('/api/file-comments', fileCommentsRouter)
app.use('/api/lessons', lessonsRouter)
app.use('/api/lesson-notes', lessonNotesRouter)
app.use('/api/annotations', annotationsRouter)
app.use('/api', usersRouter)

const defaultUserPayload = {
  passwordHash: 'demo-password',
  role: 'REGISTERED' as UserRole,
  school: null as string | null,
  faculty: null as string | null,
  studyMajor: null as string | null,
  studyYear: null as string | null,
  studyType: null as string | null,
  birthDate: null as Date | null,
  bio: null as string | null,
  avatarDataUrl: null as string | null,
}

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

void start()

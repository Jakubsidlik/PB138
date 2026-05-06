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
import { tasksRouter } from './tasks.js'
import { eventsRouter } from './events.js'
import { studyPlansRouter } from './study-plans.js'
import { subjectsRouter } from './subjects.js'
import { filesRouter, adminFilesRouter, fileCommentsRouter } from './files.js'
import { lessonsRouter, lessonNotesRouter, annotationsRouter } from './lessons.js'

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

app.get('/api/users', async (_req, res, next) => {
  try {
    const admin = await requireAdmin(_req, res)
    if (!admin) {
      return
    }

    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        school: users.school,
        faculty: users.faculty,
        studyMajor: users.studyMajor,
        studyYear: users.studyYear,
        studyType: users.studyType,
        birthDate: users.birthDate,
        bio: users.bio,
        avatarDataUrl: users.avatarDataUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.id))

    res.json(
      rows.map((user) => ({
        id: Number(user.id),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        school: user.school ?? '',
        faculty: user.faculty,
        studyMajor: user.studyMajor ?? '',
        studyYear: user.studyYear ?? '',
        studyType: user.studyType ?? '',
        birthDate: user.birthDate ? toDateOnlyIso(user.birthDate) : null,
        bio: user.bio,
        avatarDataUrl: user.avatarDataUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.get('/api/profile', async (_req, res, next) => {
  try {
    const actor = await requireRegisteredActor(_req, res)
    if (!actor) {
      return
    }

    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        school: users.school,
        faculty: users.faculty,
        studyMajor: users.studyMajor,
        studyYear: users.studyYear,
        studyType: users.studyType,
        birthDate: users.birthDate,
        bio: users.bio,
        avatarDataUrl: users.avatarDataUrl,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, BigInt(actor.id)))
      .limit(1)

    if (!user) {
      res.status(404).json({ error: 'Profil nebyl nalezen.' })
      return
    }

    res.json({
      id: Number(user.id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      school: user.school ?? '',
      faculty: user.faculty,
      studyMajor: user.studyMajor ?? '',
      studyYear: user.studyYear ?? '',
      studyType: user.studyType ?? '',
      birthDate: user.birthDate ? toDateOnlyIso(user.birthDate) : null,
      bio: user.bio,
      avatarDataUrl: user.avatarDataUrl,
      updatedAt: user.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/profile', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) {
      return
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.id))
      .limit(1)
    if (existingUser) {
      res.status(409).json({ error: 'Profil uz existuje. Pouzijte PUT /api/profile.' })
      return
    }

    const parsed = profileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [created] = await db
      .insert(users)
      .values({
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        passwordHash: payload.password ?? defaultUserPayload.passwordHash,
        role: payload.role ?? defaultUserPayload.role,
        school: payload.school ?? null,
        faculty: payload.faculty ?? null,
        studyMajor: payload.studyMajor ?? null,
        studyYear: payload.studyYear ?? null,
        studyType: payload.studyType ?? null,
        birthDate: parseOptionalDate(payload.birthDate) ?? null,
        bio: payload.bio ?? null,
        avatarDataUrl: payload.avatarDataUrl ?? null,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        school: users.school,
        faculty: users.faculty,
        studyMajor: users.studyMajor,
        studyYear: users.studyYear,
        studyType: users.studyType,
        birthDate: users.birthDate,
        bio: users.bio,
        avatarDataUrl: users.avatarDataUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    res.status(201).json({
      id: Number(created.id),
      fullName: created.fullName,
      email: created.email,
      role: created.role,
      school: created.school ?? '',
      faculty: created.faculty,
      studyMajor: created.studyMajor ?? '',
      studyYear: created.studyYear ?? '',
      studyType: created.studyType ?? '',
      birthDate: created.birthDate ? toDateOnlyIso(created.birthDate) : null,
      bio: created.bio,
      avatarDataUrl: created.avatarDataUrl,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/profile', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const parsedBirthDate = parseOptionalDate(payload.birthDate)
    if (payload.birthDate !== undefined && parsedBirthDate === undefined) {
      res.status(400).json({ error: 'Neplatny format birthDate.' })
      return
    }

    const [updated] = await db
      .update(users)
      .set({
        fullName: payload.fullName,
        role: actor.role === 'ADMIN' ? payload.role : undefined,
        school: payload.school,
        faculty: payload.faculty,
        studyMajor: payload.studyMajor,
        studyYear: payload.studyYear,
        studyType: payload.studyType,
        birthDate: parsedBirthDate ?? undefined,
        bio: payload.bio,
        avatarDataUrl: payload.avatarDataUrl,
      })
      .where(eq(users.id, BigInt(actor.id)))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        school: users.school,
        faculty: users.faculty,
        studyMajor: users.studyMajor,
        studyYear: users.studyYear,
        studyType: users.studyType,
        birthDate: users.birthDate,
        bio: users.bio,
        avatarDataUrl: users.avatarDataUrl,
        updatedAt: users.updatedAt,
      })

    res.json({
      id: Number(updated.id),
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      school: updated.school ?? '',
      faculty: updated.faculty,
      studyMajor: updated.studyMajor ?? '',
      studyYear: updated.studyYear ?? '',
      studyType: updated.studyType ?? '',
      birthDate: updated.birthDate ? toDateOnlyIso(updated.birthDate) : null,
      bio: updated.bio,
      avatarDataUrl: updated.avatarDataUrl,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/profile', async (_req, res, next) => {
  try {
    const actor = await requireRegisteredActor(_req, res)
    if (!actor) {
      return
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, BigInt(actor.id)), isNull(users.deletedAt)))
      .limit(1)
    if (!user) {
      res.status(404).json({ error: 'Profil nebyl nalezen.' })
      return
    }

    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, user.id))

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    ((error as { code?: string }).code === '23505' || (error as { code?: string }).code === 'P2002')
  ) {
    res.status(409).json({ error: 'Konflikt unikatnich dat (pravdepodobne duplicitni code nebo email).' })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Interni chyba serveru' })
})

const start = async () => {
  app.listen(PORT, () => {
    console.log(`Server bezi na http://localhost:${PORT}`)
  })
}

void start()

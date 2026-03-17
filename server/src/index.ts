import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import {
  AccentType,
  AuditAction,
  EntityType,
  FileCategory,
  Prisma,
} from '@prisma/client'
import { prisma } from './prisma.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 5000)

app.use(cors())
app.use(express.json())

type ApiTask = {
  id: number
  title: string
  done: boolean
  subjectId: number | null
}

type ApiEvent = {
  id: number
  title: string
  date: string
  time: string | null
  location: string | null
  icon: string | null
  accent: AccentType | null
  subjectId: number | null
}

const defaultProfile = {
  fullName: 'Jakub Kowalski',
  email: 'jakub.kowalski@muni.cz',
  school: 'Masarykova univerzita',
  studyMajor: 'Informatika',
  studyYear: '3. ročník',
  studyType: 'Bakalářské studium',
  avatarDataUrl: null,
}

const asBigInt = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value))
  }

  if (typeof value === 'string' && value.trim() !== '' && /^\d+$/.test(value)) {
    return BigInt(value)
  }

  return null
}

const asNumberId = (value: bigint | null | undefined): number | null => {
  if (typeof value !== 'bigint') {
    return null
  }

  const numeric = Number(value)
  return Number.isSafeInteger(numeric) ? numeric : null
}

const toDateOnlyIso = (value: Date) => value.toISOString().slice(0, 10)

const mapTask = (task: {
  id: bigint
  title: string
  done: boolean
  subjectId: bigint | null
}): ApiTask => ({
  id: Number(task.id),
  title: task.title,
  done: task.done,
  subjectId: asNumberId(task.subjectId),
})

const mapEvent = (event: {
  id: bigint
  title: string
  date: Date
  time: string | null
  location: string | null
  icon: string | null
  accent: AccentType | null
  subjectId: bigint | null
}): ApiEvent => ({
  id: Number(event.id),
  title: event.title,
  date: toDateOnlyIso(event.date),
  time: event.time,
  location: event.location,
  icon: event.icon,
  accent: event.accent,
  subjectId: asNumberId(event.subjectId),
})

const mapAudit = (log: {
  id: bigint
  entityType: EntityType
  action: AuditAction
  entityId: bigint | null
  subjectId: bigint | null
  payload: Prisma.JsonValue
  createdAt: Date
}) => ({
  id: Number(log.id),
  entityType: log.entityType,
  action: log.action,
  entityId: asNumberId(log.entityId),
  subjectId: asNumberId(log.subjectId),
  payload: log.payload,
  createdAt: log.createdAt.toISOString(),
})

const logAudit = async (payload: {
  entityType: EntityType
  action: AuditAction
  entityId?: bigint | null
  subjectId?: bigint | null
  changes?: Prisma.JsonObject
}) => {
  await prisma.auditLog.create({
    data: {
      entityType: payload.entityType,
      action: payload.action,
      entityId: payload.entityId ?? null,
      subjectId: payload.subjectId ?? null,
      payload: payload.changes ?? undefined,
    },
  })
}

const ensureProfile = async () => {
  const existing = await prisma.profile.findFirst({ orderBy: { id: 'asc' } })
  if (existing) {
    return existing
  }

  const created = await prisma.profile.create({ data: defaultProfile })
  await logAudit({
    entityType: EntityType.PROFILE,
    action: AuditAction.CREATE,
    entityId: created.id,
    changes: {
      source: 'bootstrap',
    },
  })

  return created
}

const parseIncomingTask = (value: unknown): ApiTask | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<ApiTask>

  if (
    typeof candidate.id !== 'number' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.done !== 'boolean'
  ) {
    return null
  }

  if (
    candidate.subjectId !== null &&
    candidate.subjectId !== undefined &&
    typeof candidate.subjectId !== 'number'
  ) {
    return null
  }

  return {
    id: candidate.id,
    title: candidate.title,
    done: candidate.done,
    subjectId: candidate.subjectId ?? null,
  }
}

const parseIncomingEvent = (value: unknown): ApiEvent | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<ApiEvent>
  if (
    typeof candidate.id !== 'number' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.date !== 'string'
  ) {
    return null
  }

  const parsedDate = new Date(candidate.date)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return {
    id: candidate.id,
    title: candidate.title,
    date: toDateOnlyIso(parsedDate),
    time: typeof candidate.time === 'string' ? candidate.time : null,
    location: typeof candidate.location === 'string' ? candidate.location : null,
    icon: typeof candidate.icon === 'string' ? candidate.icon : null,
    accent:
      candidate.accent === 'primary' ||
      candidate.accent === 'amber' ||
      candidate.accent === 'emerald'
        ? candidate.accent
        : null,
    subjectId:
      typeof candidate.subjectId === 'number' || candidate.subjectId === null
        ? candidate.subjectId
        : null,
  }
}

type CursorPagination = {
  enabled: boolean
  limit: number
  cursor: bigint | null
}

const parseCursorPagination = (
  req: express.Request,
  options?: {
    defaultLimit?: number
    maxLimit?: number
  },
): CursorPagination => {
  const defaultLimit = options?.defaultLimit ?? 25
  const maxLimit = options?.maxLimit ?? 100

  const enabled =
    req.query.paginated === 'true' || req.query.cursor !== undefined || req.query.limit !== undefined

  const rawLimit = Number(req.query.limit ?? defaultLimit)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, Math.trunc(rawLimit)), maxLimit)
    : defaultLimit

  return {
    enabled,
    limit,
    cursor: asBigInt(req.query.cursor),
  }
}

const toPaginatedPayload = <T extends { id: number }>(rows: T[], limit: number) => {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows

  return {
    data,
    hasMore,
    nextCursor: hasMore && data.length > 0 ? String(data[data.length - 1].id) : null,
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'OK', message: 'Server je spuštěný', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'Databáze není dostupná' })
  }
})

app.get('/api/subjects', async (_req, res, next) => {
  try {
    const pagination = parseCursorPagination(_req, { defaultLimit: 20, maxLimit: 100 })

    const baseInclude = {
      _count: {
        select: {
          files: true,
          tasks: true,
          events: true,
        },
      },
    }

    const subjects = pagination.enabled
      ? await prisma.subject.findMany({
          take: pagination.limit + 1,
          skip: pagination.cursor ? 1 : 0,
          cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
          orderBy: { id: 'asc' },
          include: baseInclude,
        })
      : await prisma.subject.findMany({
          orderBy: { createdAt: 'asc' },
          include: baseInclude,
        })

    const mappedSubjects = subjects.map((subject) => ({
      id: Number(subject.id),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      archived: subject.archived,
      files: subject._count.files,
      tasks: subject._count.tasks,
      events: subject._count.events,
      notes: 0,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    }))

    if (!pagination.enabled) {
      res.json(mappedSubjects)
      return
    }

    const paginated = toPaginatedPayload(mappedSubjects, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/subjects', async (req, res, next) => {
  try {
    const { name, teacher, code } = req.body as {
      name?: string
      teacher?: string
      code?: string
    }

    if (!name?.trim() || !teacher?.trim() || !code?.trim()) {
      res.status(400).json({ error: 'Pole name, teacher a code jsou povinná.' })
      return
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        teacher: teacher.trim(),
        code: code.trim().toUpperCase(),
      },
    })

    await logAudit({
      entityType: EntityType.SUBJECT,
      action: AuditAction.CREATE,
      entityId: subject.id,
      subjectId: subject.id,
      changes: {
        name: subject.name,
        code: subject.code,
      },
    })

    res.status(201).json({
      id: Number(subject.id),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      archived: subject.archived,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/subjects/:id', async (req, res, next) => {
  try {
    const subjectId = asBigInt(req.params.id)

    if (!subjectId) {
      res.status(400).json({ error: 'Neplatné ID předmětu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!existing) {
      res.status(404).json({ error: 'Předmět nebyl nalezen.' })
      return
    }

    const { name, teacher, code, archived } = req.body as {
      name?: string
      teacher?: string
      code?: string
      archived?: boolean
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        teacher: typeof teacher === 'string' ? teacher.trim() : undefined,
        code: typeof code === 'string' ? code.trim().toUpperCase() : undefined,
        archived: typeof archived === 'boolean' ? archived : undefined,
      },
    })

    await logAudit({
      entityType: EntityType.SUBJECT,
      action: AuditAction.UPDATE,
      entityId: updated.id,
      subjectId: updated.id,
      changes: {
        before: {
          name: existing.name,
          teacher: existing.teacher,
          code: existing.code,
          archived: existing.archived,
        },
        after: {
          name: updated.name,
          teacher: updated.teacher,
          code: updated.code,
          archived: updated.archived,
        },
      },
    })

    res.json({
      id: Number(updated.id),
      name: updated.name,
      teacher: updated.teacher,
      code: updated.code,
      archived: updated.archived,
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/subjects/:id', async (req, res, next) => {
  try {
    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatné ID předmětu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!existing) {
      res.status(404).json({ error: 'Předmět nebyl nalezen.' })
      return
    }

    await prisma.subject.delete({ where: { id: subjectId } })

    await logAudit({
      entityType: EntityType.SUBJECT,
      action: AuditAction.DELETE,
      entityId: subjectId,
      subjectId,
      changes: {
        name: existing.name,
        code: existing.code,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/files', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 25, maxLimit: 100 })
    const subjectId = asBigInt(req.query.subjectId)
    const shared = req.query.shared

    const findArgs: Prisma.FileRecordFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      where: {
        subjectId: subjectId ?? undefined,
        shared: shared === 'true' ? true : shared === 'false' ? false : undefined,
      },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const files = await prisma.fileRecord.findMany(findArgs)

    const mappedFiles = files.map((file) => ({
      id: Number(file.id),
      name: file.name,
      size: file.size,
      addedLabel: file.addedLabel,
      category: file.category,
      shared: file.shared,
      subjectId: asNumberId(file.subjectId),
    }))

    if (!pagination.enabled) {
      res.json(mappedFiles)
      return
    }

    const paginated = toPaginatedPayload(mappedFiles, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/files', async (req, res, next) => {
  try {
    const { name, size, addedLabel, category, shared, subjectId } = req.body as {
      name?: string
      size?: string
      addedLabel?: string
      category?: FileCategory
      shared?: boolean
      subjectId?: number | null
    }

    if (!name?.trim() || !size?.trim()) {
      res.status(400).json({ error: 'Pole name a size jsou povinná.' })
      return
    }

    const validCategory: FileCategory =
      category === 'folder' ||
      category === 'pdf' ||
      category === 'image' ||
      category === 'document' ||
      category === 'other'
        ? category
        : 'other'

    const created = await prisma.fileRecord.create({
      data: {
        name: name.trim(),
        size: size.trim(),
        addedLabel: typeof addedLabel === 'string' ? addedLabel : 'Added now',
        category: validCategory,
        shared: typeof shared === 'boolean' ? shared : false,
        subjectId: asBigInt(subjectId) ?? null,
      },
    })

    await logAudit({
      entityType: EntityType.FILE,
      action: AuditAction.CREATE,
      entityId: created.id,
      subjectId: created.subjectId,
      changes: {
        name: created.name,
        category: created.category,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      name: created.name,
      size: created.size,
      addedLabel: created.addedLabel,
      category: created.category,
      shared: created.shared,
      subjectId: asNumberId(created.subjectId),
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/files/:id', async (req, res, next) => {
  try {
    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatné ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const { name, size, addedLabel, category, shared, subjectId } = req.body as {
      name?: string
      size?: string
      addedLabel?: string
      category?: FileCategory
      shared?: boolean
      subjectId?: number | null
    }

    const updated = await prisma.fileRecord.update({
      where: { id: fileId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        size: typeof size === 'string' ? size.trim() : undefined,
        addedLabel: typeof addedLabel === 'string' ? addedLabel : undefined,
        category:
          category === 'folder' ||
          category === 'pdf' ||
          category === 'image' ||
          category === 'document' ||
          category === 'other'
            ? category
            : undefined,
        shared: typeof shared === 'boolean' ? shared : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
      },
    })

    await logAudit({
      entityType: EntityType.FILE,
      action: AuditAction.UPDATE,
      entityId: updated.id,
      subjectId: updated.subjectId,
      changes: {
        before: {
          name: existing.name,
          category: existing.category,
          shared: existing.shared,
          subjectId: asNumberId(existing.subjectId),
        },
        after: {
          name: updated.name,
          category: updated.category,
          shared: updated.shared,
          subjectId: asNumberId(updated.subjectId),
        },
      },
    })

    res.json({
      id: Number(updated.id),
      name: updated.name,
      size: updated.size,
      addedLabel: updated.addedLabel,
      category: updated.category,
      shared: updated.shared,
      subjectId: asNumberId(updated.subjectId),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/files/:id', async (req, res, next) => {
  try {
    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatné ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    await prisma.fileRecord.delete({ where: { id: fileId } })

    await logAudit({
      entityType: EntityType.FILE,
      action: AuditAction.DELETE,
      entityId: fileId,
      subjectId: existing.subjectId,
      changes: {
        name: existing.name,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/profile', async (_req, res, next) => {
  try {
    const profile = await ensureProfile()
    res.json({
      id: Number(profile.id),
      fullName: profile.fullName,
      email: profile.email,
      school: profile.school,
      studyMajor: profile.studyMajor,
      studyYear: profile.studyYear,
      studyType: profile.studyType,
      avatarDataUrl: profile.avatarDataUrl,
      updatedAt: profile.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/profile', async (req, res, next) => {
  try {
    const existing = await prisma.profile.findFirst({ orderBy: { id: 'asc' } })
    if (existing) {
      res.status(409).json({ error: 'Profil už existuje. Použijte PUT /api/profile.' })
      return
    }

    const payload = req.body as Partial<typeof defaultProfile>

    if (!payload.fullName || !payload.email || !payload.school) {
      res.status(400).json({ error: 'Pole fullName, email a school jsou povinná.' })
      return
    }

    const created = await prisma.profile.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        school: payload.school,
        studyMajor: payload.studyMajor ?? '',
        studyYear: payload.studyYear ?? '',
        studyType: payload.studyType ?? '',
        avatarDataUrl:
          typeof payload.avatarDataUrl === 'string' || payload.avatarDataUrl === null
            ? payload.avatarDataUrl
            : null,
      },
    })

    await logAudit({
      entityType: EntityType.PROFILE,
      action: AuditAction.CREATE,
      entityId: created.id,
      changes: {
        source: 'api',
      },
    })

    res.status(201).json({
      id: Number(created.id),
      fullName: created.fullName,
      email: created.email,
      school: created.school,
      studyMajor: created.studyMajor,
      studyYear: created.studyYear,
      studyType: created.studyType,
      avatarDataUrl: created.avatarDataUrl,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/profile', async (req, res, next) => {
  try {
    const profile = await ensureProfile()

    const payload = req.body as Partial<typeof defaultProfile>

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        fullName: typeof payload.fullName === 'string' ? payload.fullName : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        school: typeof payload.school === 'string' ? payload.school : undefined,
        studyMajor: typeof payload.studyMajor === 'string' ? payload.studyMajor : undefined,
        studyYear: typeof payload.studyYear === 'string' ? payload.studyYear : undefined,
        studyType: typeof payload.studyType === 'string' ? payload.studyType : undefined,
        avatarDataUrl:
          typeof payload.avatarDataUrl === 'string' || payload.avatarDataUrl === null
            ? payload.avatarDataUrl
            : undefined,
      },
    })

    await logAudit({
      entityType: EntityType.PROFILE,
      action: AuditAction.UPDATE,
      entityId: updated.id,
      changes: {
        fields: Object.keys(payload),
      },
    })

    res.json({
      id: Number(updated.id),
      fullName: updated.fullName,
      email: updated.email,
      school: updated.school,
      studyMajor: updated.studyMajor,
      studyYear: updated.studyYear,
      studyType: updated.studyType,
      avatarDataUrl: updated.avatarDataUrl,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/profile', async (_req, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({ orderBy: { id: 'asc' } })
    if (!profile) {
      res.status(404).json({ error: 'Profil nebyl nalezen.' })
      return
    }

    await prisma.profile.delete({ where: { id: profile.id } })

    await logAudit({
      entityType: EntityType.PROFILE,
      action: AuditAction.DELETE,
      entityId: profile.id,
      changes: {
        fullName: profile.fullName,
        email: profile.email,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/tasks', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)

    const findArgs: Prisma.TaskFindManyArgs = {
      orderBy: { createdAt: 'asc' },
      where: {
        subjectId: subjectId ?? undefined,
      },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const tasks = await prisma.task.findMany(findArgs)

    const mappedTasks = tasks.map(mapTask)

    if (!pagination.enabled) {
      res.json(mappedTasks)
      return
    }

    const paginated = toPaginatedPayload(mappedTasks, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, done, subjectId } = req.body as {
      title?: string
      done?: boolean
      subjectId?: number | null
    }

    if (!title?.trim()) {
      res.status(400).json({ error: 'Pole title je povinné.' })
      return
    }

    const created = await prisma.task.create({
      data: {
        title: title.trim(),
        done: typeof done === 'boolean' ? done : false,
        subjectId: asBigInt(subjectId) ?? null,
      },
    })

    await logAudit({
      entityType: EntityType.TASK,
      action: AuditAction.CREATE,
      entityId: created.id,
      subjectId: created.subjectId,
      changes: {
        title: created.title,
        done: created.done,
      },
    })

    res.status(201).json(mapTask(created))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatné ID úkolu.' })
      return
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existing) {
      res.status(404).json({ error: 'Úkol nebyl nalezen.' })
      return
    }

    const { title, done, subjectId } = req.body as {
      title?: string
      done?: boolean
      subjectId?: number | null
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: typeof title === 'string' ? title.trim() : undefined,
        done: typeof done === 'boolean' ? done : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
      },
    })

    await logAudit({
      entityType: EntityType.TASK,
      action: AuditAction.UPDATE,
      entityId: updated.id,
      subjectId: updated.subjectId,
      changes: {
        before: mapTask(existing),
        after: mapTask(updated),
      },
    })

    res.json(mapTask(updated))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatné ID úkolu.' })
      return
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existing) {
      res.status(404).json({ error: 'Úkol nebyl nalezen.' })
      return
    }

    await prisma.task.delete({ where: { id: taskId } })

    await logAudit({
      entityType: EntityType.TASK,
      action: AuditAction.DELETE,
      entityId: taskId,
      subjectId: existing.subjectId,
      changes: {
        title: existing.title,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.put('/api/tasks', async (req, res, next) => {
  try {
    const { tasks } = req.body as { tasks?: unknown[] }

    if (!Array.isArray(tasks)) {
      res.status(400).json({ error: 'Neplatný payload: očekává se pole tasks.' })
      return
    }

    const parsedTasks = tasks.map(parseIncomingTask)
    if (parsedTasks.some((task) => task === null)) {
      res.status(400).json({ error: 'Neplatná struktura tasku.' })
      return
    }

    const typedTasks = parsedTasks as ApiTask[]
    const existingTasks = await prisma.task.findMany()
    const existingById = new Map(existingTasks.map((task) => [task.id.toString(), task]))

    const incomingIds = typedTasks.map((task) => BigInt(task.id))
    const incomingIdSet = new Set(incomingIds.map((id) => id.toString()))

    await prisma.$transaction(async (transaction) => {
      for (const task of typedTasks) {
        const taskId = BigInt(task.id)
        const before = existingById.get(taskId.toString())
        const nextSubjectId = asBigInt(task.subjectId)

        const upserted = await transaction.task.upsert({
          where: { id: taskId },
          update: {
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
          },
          create: {
            id: taskId,
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
          },
        })

        if (!before) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.TASK,
              action: AuditAction.CREATE,
              entityId: taskId,
              subjectId: upserted.subjectId,
              payload: {
                source: 'sync',
              },
            },
          })
          continue
        }

        const changed =
          before.title !== upserted.title ||
          before.done !== upserted.done ||
          (before.subjectId?.toString() ?? null) !== (upserted.subjectId?.toString() ?? null)

        if (changed) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.TASK,
              action: AuditAction.UPDATE,
              entityId: taskId,
              subjectId: upserted.subjectId,
              payload: {
                source: 'sync',
                before: {
                  title: before.title,
                  done: before.done,
                  subjectId: asNumberId(before.subjectId),
                },
                after: {
                  title: upserted.title,
                  done: upserted.done,
                  subjectId: asNumberId(upserted.subjectId),
                },
              },
            },
          })
        }
      }

      const removedTasks = existingTasks.filter((task) => !incomingIdSet.has(task.id.toString()))

      if (removedTasks.length > 0) {
        for (const removedTask of removedTasks) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.TASK,
              action: AuditAction.DELETE,
              entityId: removedTask.id,
              subjectId: removedTask.subjectId,
              payload: {
                source: 'sync',
                title: removedTask.title,
              },
            },
          })
        }

        await transaction.task.deleteMany({
          where: {
            id: {
              in: removedTasks.map((task) => task.id),
            },
          },
        })
      }
    })

    const finalTasks = await prisma.task.findMany({ orderBy: { createdAt: 'asc' } })
    res.json({ success: true, tasks: finalTasks.map(mapTask) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/events', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)

    const findArgs: Prisma.EventFindManyArgs = {
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      where: {
        subjectId: subjectId ?? undefined,
      },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const events = await prisma.event.findMany(findArgs)

    const mappedEvents = events.map(mapEvent)

    if (!pagination.enabled) {
      res.json(mappedEvents)
      return
    }

    const paginated = toPaginatedPayload(mappedEvents, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/events', async (req, res, next) => {
  try {
    const { title, date, time, location, icon, accent, subjectId } = req.body as {
      title?: string
      date?: string
      time?: string | null
      location?: string | null
      icon?: string | null
      accent?: AccentType | null
      subjectId?: number | null
    }

    if (!title?.trim() || !date?.trim()) {
      res.status(400).json({ error: 'Pole title a date jsou povinná.' })
      return
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatný formát data.' })
      return
    }

    const created = await prisma.event.create({
      data: {
        title: title.trim(),
        date: parsedDate,
        time: typeof time === 'string' ? time : null,
        location: typeof location === 'string' ? location : null,
        icon: typeof icon === 'string' ? icon : null,
        accent:
          accent === 'primary' || accent === 'amber' || accent === 'emerald' ? accent : null,
        subjectId: asBigInt(subjectId) ?? null,
      },
    })

    await logAudit({
      entityType: EntityType.EVENT,
      action: AuditAction.CREATE,
      entityId: created.id,
      subjectId: created.subjectId,
      changes: {
        title: created.title,
        date: toDateOnlyIso(created.date),
      },
    })

    res.status(201).json(mapEvent(created))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/events/:id', async (req, res, next) => {
  try {
    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatné ID události.' })
      return
    }

    const existing = await prisma.event.findUnique({ where: { id: eventId } })
    if (!existing) {
      res.status(404).json({ error: 'Událost nebyla nalezena.' })
      return
    }

    const payload = req.body as {
      title?: string
      date?: string
      time?: string | null
      location?: string | null
      icon?: string | null
      accent?: AccentType | null
      subjectId?: number | null
    }

    const parsedDate =
      typeof payload.date === 'string' ? new Date(payload.date) : undefined

    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatný formát data.' })
      return
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
        date: parsedDate,
        time: typeof payload.time === 'string' || payload.time === null ? payload.time : undefined,
        location:
          typeof payload.location === 'string' || payload.location === null
            ? payload.location
            : undefined,
        icon: typeof payload.icon === 'string' || payload.icon === null ? payload.icon : undefined,
        accent:
          payload.accent === 'primary' || payload.accent === 'amber' || payload.accent === 'emerald'
            ? payload.accent
            : payload.accent === null
              ? null
              : undefined,
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
      },
    })

    await logAudit({
      entityType: EntityType.EVENT,
      action: AuditAction.UPDATE,
      entityId: updated.id,
      subjectId: updated.subjectId,
      changes: {
        before: mapEvent(existing),
        after: mapEvent(updated),
      },
    })

    res.json(mapEvent(updated))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/events/:id', async (req, res, next) => {
  try {
    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatné ID události.' })
      return
    }

    const existing = await prisma.event.findUnique({ where: { id: eventId } })
    if (!existing) {
      res.status(404).json({ error: 'Událost nebyla nalezena.' })
      return
    }

    await prisma.event.delete({ where: { id: eventId } })

    await logAudit({
      entityType: EntityType.EVENT,
      action: AuditAction.DELETE,
      entityId: eventId,
      subjectId: existing.subjectId,
      changes: {
        title: existing.title,
        date: toDateOnlyIso(existing.date),
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.put('/api/events', async (req, res, next) => {
  try {
    const { events } = req.body as { events?: unknown[] }

    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Neplatný payload: očekává se pole events.' })
      return
    }

    const parsedEvents = events.map(parseIncomingEvent)
    if (parsedEvents.some((event) => event === null)) {
      res.status(400).json({ error: 'Neplatná struktura eventu.' })
      return
    }

    const typedEvents = parsedEvents as ApiEvent[]
    const existingEvents = await prisma.event.findMany()
    const existingById = new Map(existingEvents.map((event) => [event.id.toString(), event]))

    const incomingIdSet = new Set(typedEvents.map((event) => BigInt(event.id).toString()))

    await prisma.$transaction(async (transaction) => {
      for (const event of typedEvents) {
        const eventId = BigInt(event.id)
        const before = existingById.get(eventId.toString())
        const parsedDate = new Date(event.date)
        const upserted = await transaction.event.upsert({
          where: { id: eventId },
          update: {
            title: event.title,
            date: parsedDate,
            time: event.time,
            location: event.location,
            icon: event.icon,
            accent: event.accent,
            subjectId: asBigInt(event.subjectId),
          },
          create: {
            id: eventId,
            title: event.title,
            date: parsedDate,
            time: event.time,
            location: event.location,
            icon: event.icon,
            accent: event.accent,
            subjectId: asBigInt(event.subjectId),
          },
        })

        if (!before) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.EVENT,
              action: AuditAction.CREATE,
              entityId: eventId,
              subjectId: upserted.subjectId,
              payload: { source: 'sync' },
            },
          })
          continue
        }

        const changed =
          before.title !== upserted.title ||
          toDateOnlyIso(before.date) !== toDateOnlyIso(upserted.date) ||
          before.time !== upserted.time ||
          before.location !== upserted.location ||
          before.icon !== upserted.icon ||
          before.accent !== upserted.accent ||
          (before.subjectId?.toString() ?? null) !== (upserted.subjectId?.toString() ?? null)

        if (changed) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.EVENT,
              action: AuditAction.UPDATE,
              entityId: eventId,
              subjectId: upserted.subjectId,
              payload: {
                source: 'sync',
                before: mapEvent(before),
                after: mapEvent(upserted),
              },
            },
          })
        }
      }

      const removedEvents = existingEvents.filter((event) => !incomingIdSet.has(event.id.toString()))

      if (removedEvents.length > 0) {
        for (const removedEvent of removedEvents) {
          await transaction.auditLog.create({
            data: {
              entityType: EntityType.EVENT,
              action: AuditAction.DELETE,
              entityId: removedEvent.id,
              subjectId: removedEvent.subjectId,
              payload: {
                source: 'sync',
                title: removedEvent.title,
                date: toDateOnlyIso(removedEvent.date),
              },
            },
          })
        }

        await transaction.event.deleteMany({
          where: {
            id: {
              in: removedEvents.map((event) => event.id),
            },
          },
        })
      }
    })

    const finalEvents = await prisma.event.findMany({
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ success: true, events: finalEvents.map(mapEvent) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/history', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 100, maxLimit: 500 })
    const entityTypeRaw = req.query.entityType
    const subjectId = asBigInt(req.query.subjectId)

    const entityType =
      entityTypeRaw === 'SUBJECT' ||
      entityTypeRaw === 'FILE' ||
      entityTypeRaw === 'PROFILE' ||
      entityTypeRaw === 'TASK' ||
      entityTypeRaw === 'EVENT'
        ? entityTypeRaw
        : undefined

    const findArgs: Prisma.AuditLogFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      where: {
        entityType,
        subjectId: subjectId ?? undefined,
      },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'desc' }
    }

    const logs = await prisma.auditLog.findMany(findArgs)

    const mappedLogs = logs.map(mapAudit)

    if (!pagination.enabled) {
      res.json(mappedLogs)
      return
    }

    const paginated = toPaginatedPayload(mappedLogs, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/history/tasks', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 100, maxLimit: 500 })

    const findArgs: Prisma.AuditLogFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: 200,
      where: { entityType: EntityType.TASK },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'desc' }
    }

    const logs = await prisma.auditLog.findMany(findArgs)

    const mappedLogs = logs.map(mapAudit)
    if (!pagination.enabled) {
      res.json(mappedLogs)
      return
    }

    const paginated = toPaginatedPayload(mappedLogs, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/history/events', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 100, maxLimit: 500 })

    const findArgs: Prisma.AuditLogFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: 200,
      where: { entityType: EntityType.EVENT },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'desc' }
    }

    const logs = await prisma.auditLog.findMany(findArgs)

    const mappedLogs = logs.map(mapAudit)
    if (!pagination.enabled) {
      res.json(mappedLogs)
      return
    }

    const paginated = toPaginatedPayload(mappedLogs, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/history/calendar', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 100, maxLimit: 500 })

    const findArgs: Prisma.AuditLogFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: 200,
      where: { entityType: EntityType.EVENT },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'desc' }
    }

    const logs = await prisma.auditLog.findMany(findArgs)

    const mappedLogs = logs.map(mapAudit)
    if (!pagination.enabled) {
      res.json(mappedLogs)
      return
    }

    const paginated = toPaginatedPayload(mappedLogs, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/subjects/:id/history', async (req, res, next) => {
  try {
    const pagination = parseCursorPagination(req, { defaultLimit: 100, maxLimit: 500 })
    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatné ID předmětu.' })
      return
    }

    const findArgs: Prisma.AuditLogFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      take: 200,
      where: { subjectId },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'desc' }
    }

    const logs = await prisma.auditLog.findMany(findArgs)

    const mappedLogs = logs.map(mapAudit)
    if (!pagination.enabled) {
      res.json(mappedLogs)
      return
    }

    const paginated = toPaginatedPayload(mappedLogs, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  ) {
    res.status(409).json({ error: 'Konflikt unikátních dat (pravděpodobně duplicitní code).' })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Interní chyba serveru' })
})

const start = async () => {
  const maxRetries = Number(process.env.DB_CONNECT_RETRIES ?? 10)
  const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS ?? 2000)

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await prisma.$connect()
      app.listen(PORT, () => {
        console.log(`🚀 Server běží na http://localhost:${PORT}`)
      })
      return
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      if (isLastAttempt) {
        console.error('❌ Nepodařilo se připojit k databázi:', error)
        process.exit(1)
      }

      console.warn(
        `⚠️ Databáze zatím není dostupná (pokus ${attempt}/${maxRetries}). Opakuji za ${retryDelayMs} ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
    }
  }
}

void start()

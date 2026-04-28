import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import {
  AnnotationTargetType,
  CollaborationRole,
  EventRecurrence,
  Prisma,
  TaskPriority,
  UserRole,
} from '@prisma/client'
import { prisma } from './prisma.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 5000)

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

const s3Endpoint = process.env.S3_ENDPOINT

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'eu-west-1',
  endpoint: s3Endpoint || undefined,
  forcePathStyle: !!s3Endpoint, // Nutné pro Supabase
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

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

type ApiTask = {
  id: number
  title: string
  done: boolean
  subjectId: number | null
  tag?: string | null
}

type ApiEvent = {
  id: number
  title: string
  date: string
  time: string | null
  location: string | null
  subjectId: number | null
  isShared?: boolean
  recurrence?: EventRecurrence
  recurrenceGroupId?: string | null
}

type AuthActor = {
  id: number
  fullName: string
  email: string
  role: UserRole | 'PUBLIC'
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

const parseOptionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const parseTaskPriority = (value: unknown): TaskPriority | undefined => {
  if (value === 'NONE' || value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value
  }

  return undefined
}

const parseUserRole = (value: unknown): UserRole | undefined => {
  if (value === 'REGISTERED' || value === 'ADMIN') {
    return value
  }

  return undefined
}

const parseEventRecurrence = (value: unknown): EventRecurrence | undefined => {
  if (value === 'NONE' || value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY') {
    return value
  }

  return undefined
}

const parseCollaborationRole = (value: unknown): CollaborationRole | undefined => {
  if (value === 'VIEWER' || value === 'CONTRIBUTOR') {
    return value
  }

  return undefined
}

const parseAnnotationTargetType = (value: unknown): AnnotationTargetType | undefined => {
  if (value === 'LESSON' || value === 'LESSON_NOTE' || value === 'FILE_COMMENT') {
    return value
  }

  return undefined
}

const canActorReadLessonTarget = async (
  lessonId: bigint,
  actor: AuthActor,
): Promise<boolean> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      deletedAt: true,
      isShared: true,
      subject: {
        select: {
          userId: true,
        },
      },
      studyPlan: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  })

  if (!lesson || lesson.deletedAt) {
    return false
  }

  if (lesson.isShared) {
    return true
  }

  if (isPublicActor(actor)) {
    return false
  }

  if (actor.role === 'ADMIN') {
    return true
  }

  if (lesson.subject?.userId === BigInt(actor.id) || lesson.studyPlan?.userId === BigInt(actor.id)) {
    return true
  }

  if (!lesson.studyPlan?.id) {
    return false
  }

  const collaborator = await prisma.studyPlanCollaborator.findFirst({
    where: { studyPlanId: lesson.studyPlan.id, userId: BigInt(actor.id) },
  })

  return collaborator !== null
}

const canActorReadAnnotationTarget = async (
  targetType: AnnotationTargetType,
  targetId: bigint,
  actor: AuthActor,
): Promise<boolean> => {
  if (targetType === 'LESSON') {
    return canActorReadLessonTarget(targetId, actor)
  }

  if (targetType === 'LESSON_NOTE') {
    const note = await prisma.lessonNote.findUnique({
      where: { id: targetId },
      select: {
        lessonId: true,
      },
    })
    if (!note) {
      return false
    }

    return canActorReadLessonTarget(note.lessonId, actor)
  }

  const fileComment = await prisma.fileComment.findUnique({
    where: { id: targetId },
    select: {
      file: {
        select: {
          deletedAt: true,
          isShared: true,
          userId: true,
        },
      },
    },
  })

  if (!fileComment || fileComment.file.deletedAt) {
    return false
  }

  if (fileComment.file.isShared) {
    return true
  }

  if (isPublicActor(actor)) {
    return false
  }

  return actor.role === 'ADMIN' || fileComment.file.userId === BigInt(actor.id)
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const buildRecurringDates = (baseDate: Date, recurrence: EventRecurrence, repeatCount: number): Date[] => {
  const safeCount = Math.min(Math.max(repeatCount, 1), 24)
  const dates: Date[] = []

  for (let index = 0; index < safeCount; index += 1) {
    if (index === 0) {
      dates.push(new Date(baseDate))
      continue
    }

    if (recurrence === 'DAILY') {
      dates.push(addDays(baseDate, index))
      continue
    }

    if (recurrence === 'WEEKLY') {
      dates.push(addDays(baseDate, index * 7))
      continue
    }

    if (recurrence === 'MONTHLY') {
      dates.push(addMonths(baseDate, index))
      continue
    }

    break
  }

  return dates
}

const parseFileSizeToBytes = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value)
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10)
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)
  if (!match) {
    return undefined
  }

  const amount = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()

  if (unit === 'KB') {
    return Math.round(amount * 1024)
  }

  if (unit === 'MB') {
    return Math.round(amount * 1024 * 1024)
  }

  return Math.round(amount * 1024 * 1024 * 1024)
}

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

const inferFileCategory = (fileName: string): 'folder' | 'pdf' | 'image' | 'document' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return 'pdf'
  }

  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
    return 'image'
  }

  if (ext === 'doc' || ext === 'docx' || ext === 'txt' || ext === 'rtf' || ext === 'ppt' || ext === 'pptx') {
    return 'document'
  }

  return 'other'
}

const mapTask = (task: {
  id: bigint
  userId: bigint
  title: string
  done: boolean
  subjectId: bigint | null
  studyPlanId: bigint | null
  favorite: boolean
  tag: string | null
  deadline: Date | null
  deletedAt: Date | null
}): ApiTask & {
  userId: number
  studyPlanId: number | null
  favorite: boolean
  tag: string | null
  deadline: string | null
  deletedAt: string | null
} => ({
  id: Number(task.id),
  userId: Number(task.userId),
  title: task.title,
  done: task.done,
  subjectId: asNumberId(task.subjectId),
  studyPlanId: asNumberId(task.studyPlanId),
  favorite: task.favorite,
  tag: task.tag,
  deadline: task.deadline ? task.deadline.toISOString() : null,
  deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
})

const mapEvent = (event: {
  id: bigint
  userId: bigint
  title: string
  date: Date
  time: string | null
  location: string | null
  isShared: boolean
  recurrence: EventRecurrence
  recurrenceGroupId: string | null
  subjectId: bigint | null
  deletedAt: Date | null
}): ApiEvent & {
  userId: number
  deletedAt: string | null
} => ({
  id: Number(event.id),
  userId: Number(event.userId),
  title: event.title,
  date: toDateOnlyIso(event.date),
  time: event.time,
  location: event.location,
  isShared: event.isShared,
  recurrence: event.recurrence,
  recurrenceGroupId: event.recurrenceGroupId,
  subjectId: asNumberId(event.subjectId),
  deletedAt: event.deletedAt ? event.deletedAt.toISOString() : null,
})

const mapFileRecord = (file: {
  id: bigint
  userId: bigint
  subjectId: bigint | null
  lessonId: bigint | null
  name: string
  size: number
  addedLabel: string
  isShared: boolean
  fileKey: string | null
  fileUrl: string | null
  deletedAt: Date | null
}) => ({
  id: Number(file.id),
  userId: Number(file.userId),
  subjectId: asNumberId(file.subjectId),
  lessonId: asNumberId(file.lessonId),
  name: file.name,
  category: inferFileCategory(file.name),
  size: formatFileSize(file.size),
  sizeBytes: file.size,
  fileKey: file.fileKey,
  fileUrl: file.fileUrl,
  addedLabel: file.addedLabel,
  isShared: file.isShared,
  shared: file.isShared,
  deletedAt: file.deletedAt ? file.deletedAt.toISOString() : null,
})

const toAuthActor = (user: {
  id: bigint
  fullName: string
  email: string
  role: UserRole
}): AuthActor => ({
  id: Number(user.id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
})

const getActorFromRequest = async (req: express.Request): Promise<AuthActor> => {
  const auth = getAuth(req)
  const requestedUserId = asBigInt(req.header('x-user-id'))

  // Fallback pro lokální mock (Admin tlačítko)
  if (requestedUserId && !auth.userId) {
    const requestedUser = await prisma.user.findFirst({
      where: { id: requestedUserId, deletedAt: null },
    })

    if (requestedUser) {
      return toAuthActor(requestedUser)
    }
  }

  // Ostrá Clerk autentifikace
  if (auth.userId) {
    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId }
    })

    if (user && user.deletedAt === null) {
      return toAuthActor(user)
    }

    // Pokud uživatel ještě není v Prisma DB, vytvoříme ho nebo ho propojíme přes email
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId)
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Uživatel'

        if (email) {
          user = await prisma.user.findUnique({ where: { email } })
        }

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { clerkId: auth.userId, deletedAt: null }
          })
        } else {
          user = await prisma.user.create({
            data: { clerkId: auth.userId, email, fullName, role: 'REGISTERED' }
          })
        }
        return toAuthActor(user)
      } catch (err) {
        console.error(`Chyba při vytváření uživatele z Clerku:`, err)
      }
    }
  }

  return {
    id: 0,
    fullName: 'Verejnost',
    email: '',
    role: 'PUBLIC',
  }
}

const isPublicActor = (actor: AuthActor) => actor.role === 'PUBLIC'

const requireRegisteredActor = async (req: express.Request, res: express.Response) => {
  const actor = await getActorFromRequest(req)
  if (isPublicActor(actor)) {
    res.status(401).json({ error: 'Tato akce vyzaduje prihlaseni.' })
    return null
  }

  return actor
}

const requireAdmin = async (req: express.Request, res: express.Response) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) {
    return null
  }

  if (actor.role !== 'ADMIN') {
    res.status(403).json({ error: 'Tato akce vyzaduje roli admin.' })
    return null
  }

  return actor
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
    isShared: typeof candidate.isShared === 'boolean' ? candidate.isShared : false,
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

    const users = await prisma.user.findMany({ where: { deletedAt: null }, orderBy: { id: 'asc' } })
    res.json(
      users.map((user) => ({
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

    const user = await prisma.user.findUnique({ where: { id: BigInt(actor.id) } })

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

    const existing = await prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { id: 'asc' } })
    if (existing) {
      res.status(409).json({ error: 'Profil uz existuje. Pouzijte PUT /api/profile.' })
      return
    }

    const payload = req.body as Partial<typeof defaultUserPayload> & {
      password?: string
      role?: UserRole
    }

    if (!payload.fullName || !payload.email) {
      res.status(400).json({ error: 'Pole fullName, email a school jsou povinna.' })
      return
    }

    const created = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        passwordHash: payload.password ?? defaultUserPayload.passwordHash,
        role: parseUserRole(payload.role) ?? defaultUserPayload.role,
        school: payload.school ?? null,
        faculty: payload.faculty ?? null,
        studyMajor: payload.studyMajor ?? null,
        studyYear: payload.studyYear ?? null,
        studyType: payload.studyType ?? null,
        birthDate: parseOptionalDate(payload.birthDate) ?? null,
        bio: payload.bio ?? null,
        avatarDataUrl:
          typeof payload.avatarDataUrl === 'string' || payload.avatarDataUrl === null
            ? payload.avatarDataUrl
            : null,
      },
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

    const payload = req.body as Partial<typeof defaultUserPayload> & {
      password?: string
      role?: UserRole
    }

    const parsedBirthDate = parseOptionalDate(payload.birthDate)
    if (payload.birthDate !== undefined && parsedBirthDate === undefined) {
      res.status(400).json({ error: 'Neplatny format birthDate.' })
      return
    }

    const updated = await prisma.user.update({
      where: { id: BigInt(actor.id) },
      data: {
        fullName: typeof payload.fullName === 'string' ? payload.fullName : undefined,
        role:
          actor.role === 'ADMIN' && payload.role !== undefined
            ? parseUserRole(payload.role)
            : undefined,
        school: typeof payload.school === 'string' ? payload.school : undefined,
        faculty: typeof payload.faculty === 'string' || payload.faculty === null ? payload.faculty : undefined,
        studyMajor: typeof payload.studyMajor === 'string' ? payload.studyMajor : undefined,
        studyYear: typeof payload.studyYear === 'string' ? payload.studyYear : undefined,
        studyType: typeof payload.studyType === 'string' ? payload.studyType : undefined,
        birthDate: parsedBirthDate,
        bio: typeof payload.bio === 'string' || payload.bio === null ? payload.bio : undefined,
        avatarDataUrl:
          typeof payload.avatarDataUrl === 'string' || payload.avatarDataUrl === null
            ? payload.avatarDataUrl
            : undefined,
      },
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

    const user = await prisma.user.findFirst({ where: { id: BigInt(actor.id), deletedAt: null } })
    if (!user) {
      res.status(404).json({ error: 'Profil nebyl nalezen.' })
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/study-plans', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const includeInactive = req.query.includeInactive === 'true'

    const where: Prisma.StudyPlanWhereInput = isPublicActor(actor)
      ? {
          isShared: true,
          isActive: includeInactive ? undefined : true,
        }
      : {
          isActive: includeInactive ? undefined : true,
          OR: [
            { userId: BigInt(actor.id) },
            { isShared: true },
            { collaborators: { some: { userId: BigInt(actor.id) } } },
          ],
        }

    const studyPlans = await prisma.studyPlan.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
      include: {
        _count: {
          select: {
            subjects: true,
            tasks: true,
            lessons: true,
          },
        },
      },
    })

    const collaboratorRoleByPlanId = new Map<string, CollaborationRole>()
    if (!isPublicActor(actor) && studyPlans.length > 0) {
      const collaborators = await prisma.studyPlanCollaborator.findMany({
        where: {
          userId: BigInt(actor.id),
          studyPlanId: { in: studyPlans.map((plan) => plan.id) },
        },
        select: {
          studyPlanId: true,
          role: true,
        },
      })

      for (const collaborator of collaborators) {
        collaboratorRoleByPlanId.set(collaborator.studyPlanId.toString(), collaborator.role)
      }
    }

    res.json(
      studyPlans.map((plan) => ({
        id: Number(plan.id),
        userId: Number(plan.userId),
        name: plan.name,
        description: plan.description,
        faculty: plan.faculty,
        startDate: plan.startDate ? toDateOnlyIso(plan.startDate) : null,
        endDate: plan.endDate ? toDateOnlyIso(plan.endDate) : null,
        isActive: plan.isActive,
        isShared: plan.isShared,
        collaboratorRole: collaboratorRoleByPlanId.get(plan.id.toString()) ?? null,
        canEditMetadata:
          !isPublicActor(actor) && (actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)),
        canCreateSubjects:
          !isPublicActor(actor) &&
          (actor.role === 'ADMIN' ||
            plan.userId === BigInt(actor.id) ||
            collaboratorRoleByPlanId.get(plan.id.toString()) === 'CONTRIBUTOR'),
        subjectsCount: plan._count.subjects,
        tasksCount: plan._count.tasks,
        lessonsCount: plan._count.lessons,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/study-plans', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const payload = req.body as {
      name?: string
      description?: string | null
      faculty?: string | null
      startDate?: string
      endDate?: string | null
      isActive?: boolean
      isShared?: boolean
    }

    if (!payload.name?.trim()) {
      res.status(400).json({ error: 'Pole name je povinne.' })
      return
    }

    const parsedStartDate = parseOptionalDate(payload.startDate)
    if (payload.startDate !== undefined && parsedStartDate === undefined) {
      res.status(400).json({ error: 'Neplatny format startDate.' })
      return
    }

    const parsedEndDate = parseOptionalDate(payload.endDate)
    if (payload.endDate !== undefined && parsedEndDate === undefined) {
      res.status(400).json({ error: 'Neplatny format endDate.' })
      return
    }

    const created = await prisma.studyPlan.create({
      data: {
        userId: BigInt(actor.id),
        name: payload.name.trim(),
        description: typeof payload.description === 'string' ? payload.description.trim() : null,
        faculty: typeof payload.faculty === 'string' ? payload.faculty.trim() : null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : false,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      userId: Number(created.userId),
      name: created.name,
      description: created.description,
      faculty: created.faculty,
      startDate: created.startDate ? toDateOnlyIso(created.startDate) : null,
      endDate: created.endDate ? toDateOnlyIso(created.endDate) : null,
      isActive: created.isActive,
      isShared: created.isShared,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/study-plans/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)

    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const existing = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!existing) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canEditMetadata = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canEditMetadata) {
      res.status(403).json({ error: 'Nemate opravneni upravovat metadata tohoto planu.' })
      return
    }

    const payload = req.body as {
      name?: string
      description?: string | null
      faculty?: string | null
      startDate?: string
      endDate?: string | null
      isActive?: boolean
      isShared?: boolean
    }

    const parsedStartDate = parseOptionalDate(payload.startDate)
    if (payload.startDate !== undefined && (parsedStartDate === undefined || parsedStartDate === null)) {
      res.status(400).json({ error: 'Neplatny format startDate.' })
      return
    }

    const parsedEndDate = parseOptionalDate(payload.endDate)
    if (payload.endDate !== undefined && parsedEndDate === undefined) {
      res.status(400).json({ error: 'Neplatny format endDate.' })
      return
    }

    const updated = await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: {
        name: typeof payload.name === 'string' ? payload.name.trim() : undefined,
        description:
          typeof payload.description === 'string'
            ? payload.description.trim()
            : payload.description === null
              ? null
              : undefined,
        faculty:
          typeof payload.faculty === 'string'
            ? payload.faculty.trim()
            : payload.faculty === null
              ? null
              : undefined,
        startDate: parsedStartDate ?? undefined,
        endDate: parsedEndDate,
        isActive: typeof payload.isActive === 'boolean' ? payload.isActive : undefined,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
      },
    })

    res.json({
      id: Number(updated.id),
      userId: Number(updated.userId),
      name: updated.name,
      description: updated.description,
      faculty: updated.faculty,
      startDate: updated.startDate ? toDateOnlyIso(updated.startDate) : null,
      endDate: updated.endDate ? toDateOnlyIso(updated.endDate) : null,
      isActive: updated.isActive,
      isShared: updated.isShared,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/study-plans/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)

    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const existing = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!existing) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canDelete = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento plan.' })
      return
    }

    await prisma.studyPlan.delete({ where: { id: studyPlanId } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/study-plans/:id/collaborators', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canRead =
      actor.role === 'ADMIN' ||
      plan.userId === BigInt(actor.id) ||
      (await prisma.studyPlanCollaborator.findFirst({
        where: { studyPlanId, userId: BigInt(actor.id) },
      })) !== null

    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit spolupracovniky.' })
      return
    }

    const collaborators = await prisma.studyPlanCollaborator.findMany({
      where: { studyPlanId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      collaborators.map((collaborator) => ({
        id: Number(collaborator.id),
        studyPlanId: Number(collaborator.studyPlanId),
        userId: Number(collaborator.userId),
        role: collaborator.role,
        user: {
          id: Number(collaborator.user.id),
          fullName: collaborator.user.fullName,
          email: collaborator.user.email,
        },
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/study-plans/:id/share', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    if (!studyPlanId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      res.status(403).json({ error: 'Nemate opravneni sdilet tento plan.' })
      return
    }

    const payload = req.body as { email?: string; role?: CollaborationRole }
    if (!payload.email?.trim()) {
      res.status(400).json({ error: 'Pole email je povinne.' })
      return
    }

    const user = await prisma.user.findFirst({ where: { email: payload.email.trim().toLowerCase(), deletedAt: null } })
    if (!user) {
      res.status(404).json({ error: 'Uzivatel s danym emailem nebyl nalezen.' })
      return
    }

    if (user.id === plan.userId) {
      res.status(400).json({ error: 'Vlastnika planu nelze pridat jako spolupracovnika.' })
      return
    }

    const role = parseCollaborationRole(payload.role) ?? 'VIEWER'
    const collaborator = await prisma.studyPlanCollaborator.upsert({
      where: {
        studyPlanId_userId: {
          studyPlanId,
          userId: user.id,
        },
      },
      update: {
        role,
      },
      create: {
        studyPlanId,
        userId: user.id,
        role,
      },
    })

    res.status(201).json({
      id: Number(collaborator.id),
      studyPlanId: Number(collaborator.studyPlanId),
      userId: Number(collaborator.userId),
      role: collaborator.role,
      user: {
        id: Number(user.id),
        fullName: user.fullName,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/study-plans/:id/share/:userId', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const studyPlanId = asBigInt(req.params.id)
    const userId = asBigInt(req.params.userId)
    if (!studyPlanId || !userId) {
      res.status(400).json({ error: 'Neplatne ID studijniho planu nebo uzivatele.' })
      return
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } })
    if (!plan) {
      res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
      return
    }

    const canShare = actor.role === 'ADMIN' || plan.userId === BigInt(actor.id)
    if (!canShare) {
      res.status(403).json({ error: 'Nemate opravneni upravovat sdileni tohoto planu.' })
      return
    }

    await prisma.studyPlanCollaborator.deleteMany({
      where: {
        studyPlanId,
        userId,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/subjects', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 20, maxLimit: 100 })
    const includeDeleted = req.query.includeDeleted === 'true'
    const studyPlanId = asBigInt(req.query.studyPlanId)

    const where: Prisma.SubjectWhereInput = isPublicActor(actor)
      ? {
          deletedAt: includeDeleted ? undefined : null,
          studyPlanId: studyPlanId ?? undefined,
          OR: [{ isShared: true }, { studyPlan: { isShared: true } }],
        }
      : {
          deletedAt: includeDeleted ? undefined : null,
          studyPlanId: studyPlanId ?? undefined,
          OR: [
            { userId: BigInt(actor.id) },
            { isShared: true },
            { studyPlan: { isShared: true } },
            { studyPlan: { collaborators: { some: { userId: BigInt(actor.id) } } } },
          ],
        }

    const countInclude = {
      _count: {
        select: {
          files: true,
          tasks: true,
          events: true,
          lessons: true,
        },
      },
    }

    const subjects = pagination.enabled
      ? await prisma.subject.findMany({
          take: pagination.limit + 1,
          skip: pagination.cursor ? 1 : 0,
          cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
          orderBy: { id: 'asc' },
          where,
          include: countInclude,
        })
      : await prisma.subject.findMany({
          orderBy: { createdAt: 'asc' },
          where,
          include: countInclude,
        })

    const mappedSubjects = subjects.map((subject) => ({
      id: Number(subject.id),
      userId: asNumberId(subject.userId),
      studyPlanId: asNumberId(subject.studyPlanId),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      isShared: subject.isShared,
      archived: Boolean(subject.deletedAt),
      deletedAt: subject.deletedAt ? subject.deletedAt.toISOString() : null,
      files: subject._count.files,
      tasks: subject._count.tasks,
      events: subject._count.events,
      notes: subject._count.lessons,
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
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { name, teacher, code, studyPlanId, isShared } = req.body as {
      name?: string
      teacher?: string
      code?: string
      studyPlanId?: number | null
      isShared?: boolean
    }

    if (!name?.trim() || !teacher?.trim() || !code?.trim()) {
      res.status(400).json({ error: 'Pole name, teacher a code jsou povinna.' })
      return
    }

    const parsedStudyPlanId = asBigInt(studyPlanId)
    let ownerUserId = BigInt(actor.id)

    if (parsedStudyPlanId) {
      const plan = await prisma.studyPlan.findUnique({ where: { id: parsedStudyPlanId } })
      if (!plan) {
        res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
        return
      }

      const collaborator = await prisma.studyPlanCollaborator.findFirst({
        where: { studyPlanId: parsedStudyPlanId, userId: BigInt(actor.id) },
      })

      const canCreateInPlan =
        actor.role === 'ADMIN' ||
        plan.userId === BigInt(actor.id) ||
        collaborator?.role === 'CONTRIBUTOR'

      if (!canCreateInPlan) {
        res.status(403).json({ error: 'Nemate opravneni pridavat predmety do tohoto planu.' })
        return
      }

      ownerUserId = plan.userId
    }

    const created = await prisma.subject.create({
      data: {
        userId: ownerUserId,
        studyPlanId: parsedStudyPlanId,
        name: name.trim(),
        teacher: teacher.trim(),
        code: code.trim().toUpperCase(),
        isShared: typeof isShared === 'boolean' ? isShared : false,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      userId: Number(created.userId),
      studyPlanId: asNumberId(created.studyPlanId),
      name: created.name,
      teacher: created.teacher,
      code: created.code,
      isShared: created.isShared,
      archived: false,
      deletedAt: null,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/subjects/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const subjectId = asBigInt(req.params.id)

    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!existing) {
      res.status(404).json({ error: 'Predmet nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tento predmet.' })
      return
    }

    const { name, teacher, code, archived, studyPlanId, isShared } = req.body as {
      name?: string
      teacher?: string
      code?: string
      archived?: boolean
      studyPlanId?: number | null
      isShared?: boolean
    }

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        teacher: typeof teacher === 'string' ? teacher.trim() : undefined,
        code: typeof code === 'string' ? code.trim().toUpperCase() : undefined,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        isShared: typeof isShared === 'boolean' ? isShared : undefined,
        deletedAt: typeof archived === 'boolean' ? (archived ? new Date() : null) : undefined,
      },
    })

    res.json({
      id: Number(updated.id),
      userId: asNumberId(updated.userId),
      studyPlanId: asNumberId(updated.studyPlanId),
      name: updated.name,
      teacher: updated.teacher,
      code: updated.code,
      isShared: updated.isShared,
      archived: Boolean(updated.deletedAt),
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/subjects/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!existing) {
      res.status(404).json({ error: 'Predmet nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento predmet.' })
      return
    }

    const deletedAt = new Date()

    await prisma.$transaction([
      prisma.subject.update({ where: { id: subjectId }, data: { deletedAt } }),
      prisma.task.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.fileRecord.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.lesson.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.event.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
    ])

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/tasks', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)
    const studyPlanId = asBigInt(req.query.studyPlanId)
    const includeDeleted = req.query.includeDeleted === 'true'
    const doneFilter = req.query.done
    const favoriteFilter = req.query.favorite
    const tagFilter = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const deadlineFrom = parseOptionalDate(req.query.deadlineFrom)
    const deadlineTo = parseOptionalDate(req.query.deadlineTo)

    const findArgs: Prisma.TaskFindManyArgs = {
      orderBy: { createdAt: 'asc' },
      where: {
        userId: BigInt(actor.id),
        subjectId: subjectId ?? undefined,
        studyPlanId: studyPlanId ?? undefined,
        done: doneFilter === 'true' ? true : doneFilter === 'false' ? false : undefined,
        favorite: favoriteFilter === 'true' ? true : favoriteFilter === 'false' ? false : undefined,
        tag: tagFilter ? tagFilter : undefined,
        title: search ? { contains: search, mode: 'insensitive' } : undefined,
        deadline:
          deadlineFrom || deadlineTo
            ? {
                gte: deadlineFrom ?? undefined,
                lte: deadlineTo ?? undefined,
              }
            : undefined,
        deletedAt: includeDeleted ? undefined : null,
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
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { title, done, subjectId, studyPlanId, favorite, tag, priority, deadline } = req.body as {
      title?: string
      done?: boolean
      subjectId?: number | null
      studyPlanId?: number | null
      favorite?: boolean
      tag?: string | null
      priority?: TaskPriority
      deadline?: string | null
    }

    if (!title?.trim()) {
      res.status(400).json({ error: 'Pole title je povinne.' })
      return
    }

    const parsedDeadline = parseOptionalDate(deadline)
    if (deadline !== undefined && parsedDeadline === undefined) {
      res.status(400).json({ error: 'Neplatny format deadline.' })
      return
    }

    const parsedTag =
      typeof tag === 'string'
        ? tag.trim() || null
        : priority !== undefined
          ? parseTaskPriority(priority) ?? null
          : null

    const created = await prisma.task.create({
      data: {
        userId: BigInt(actor.id),
        title: title.trim(),
        done: typeof done === 'boolean' ? done : false,
        subjectId: asBigInt(subjectId),
        studyPlanId: asBigInt(studyPlanId),
        favorite: typeof favorite === 'boolean' ? favorite : false,
        tag: parsedTag,
        deadline: parsedDeadline,
      },
    })

    res.status(201).json(mapTask(created))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: BigInt(actor.id) } })
    if (!existing) {
      res.status(404).json({ error: 'Ukol nebyl nalezen.' })
      return
    }

    const { title, done, subjectId, studyPlanId, favorite, tag, priority, deadline } = req.body as {
      title?: string
      done?: boolean
      subjectId?: number | null
      studyPlanId?: number | null
      favorite?: boolean
      tag?: string | null
      priority?: TaskPriority
      deadline?: string | null
    }

    const parsedDeadline = parseOptionalDate(deadline)
    if (deadline !== undefined && parsedDeadline === undefined) {
      res.status(400).json({ error: 'Neplatny format deadline.' })
      return
    }

    const parsedTag =
      typeof tag === 'string'
        ? tag.trim() || null
        : priority !== undefined
          ? (parseTaskPriority(priority) ?? null)
          : undefined

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: typeof title === 'string' ? title.trim() : undefined,
        done: typeof done === 'boolean' ? done : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        favorite: typeof favorite === 'boolean' ? favorite : undefined,
        tag: parsedTag,
        deadline: parsedDeadline,
      },
    })

    res.json(mapTask(updated))
  } catch (error) {
    next(error)
  }
})

app.post('/api/tasks/:id/archive', async (req, res, next) => {
  try {
    res.status(410).json({ error: 'Task archive bylo odstraneno. Pouzivejte tagy u ukolu.' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/task-archive', async (req, res, next) => {
  try {
    res.status(410).json({ error: 'Task archive bylo odstraneno. Pouzivejte tagy u ukolu.' })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: BigInt(actor.id), deletedAt: null } })
    if (!existing) {
      res.status(404).json({ error: 'Ukol nebyl nalezen.' })
      return
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.put('/api/tasks', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { tasks } = req.body as { tasks?: unknown[] }

    if (!Array.isArray(tasks)) {
      res.status(400).json({ error: 'Neplatny payload: ocekava se pole tasks.' })
      return
    }

    const parsedTasks = tasks.map(parseIncomingTask)
    if (parsedTasks.some((task) => task === null)) {
      res.status(400).json({ error: 'Neplatna struktura tasku.' })
      return
    }

    const typedTasks = parsedTasks as ApiTask[]
    const existingTasks = await prisma.task.findMany({ where: { userId: BigInt(actor.id), deletedAt: null } })
    const existingById = new Map(existingTasks.map((task) => [task.id.toString(), task]))

    const incomingIds = typedTasks.map((task) => BigInt(task.id))
    const incomingIdSet = new Set(incomingIds.map((id) => id.toString()))

    await prisma.$transaction(async (transaction) => {
      // Najdeme, které předměty z odeslaných opravdu existují v DB
      const subjectIds = Array.from(new Set(typedTasks.map((t) => t.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = await transaction.subject.findMany({
        where: { id: { in: subjectIds.map((id) => BigInt(id)) } },
        select: { id: true }
      })
      const validSubjectIds = new Set(validSubjects.map((s) => s.id.toString()))

      for (const task of typedTasks) {
        const taskId = BigInt(task.id)
        const before = existingById.get(taskId.toString())
        let nextSubjectId = asBigInt(task.subjectId)

        // Pokud předmět neexistuje, uložíme úkol bez něj, aby DB nespadla na P2003
        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        const upserted = await transaction.task.upsert({
          where: { id: taskId },
          update: {
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
            userId: BigInt(actor.id),
            deletedAt: null,
          },
          create: {
            id: taskId,
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
            userId: BigInt(actor.id),
            favorite: false,
            tag: null,
            deletedAt: null,
          },
        })

        void before
      }

      const removedTasks = existingTasks.filter((task) => !incomingIdSet.has(task.id.toString()))

      if (removedTasks.length > 0) {
        await transaction.task.updateMany({
          where: {
            id: {
              in: removedTasks.map((task) => task.id),
            },
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    })

    const finalTasks = await prisma.task.findMany({
      where: { userId: BigInt(actor.id), deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ success: true, tasks: finalTasks.map(mapTask) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/events', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const findArgs: Prisma.EventFindManyArgs = {
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      where: isPublicActor(actor)
        ? {
            isShared: true,
            subjectId: subjectId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [{ userId: BigInt(actor.id) }, { isShared: true }],
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
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { title, date, time, location, subjectId, recurrence, repeatCount, isShared } = req.body as {
      title?: string
      date?: string
      time?: string | null
      location?: string | null
      subjectId?: number | null
      recurrence?: EventRecurrence
      repeatCount?: number
      isShared?: boolean
    }

    if (!title?.trim() || !date?.trim()) {
      res.status(400).json({ error: 'Pole title a date jsou povinna.' })
      return
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatny format data.' })
      return
    }

    const parsedRecurrence = parseEventRecurrence(recurrence) ?? 'NONE'
    const safeRepeatCount = typeof repeatCount === 'number' ? Math.trunc(repeatCount) : 1
    const dates = buildRecurringDates(parsedDate, parsedRecurrence, safeRepeatCount)
    const recurrenceGroupId =
      parsedRecurrence === 'NONE' || dates.length <= 1
        ? null
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const created = await prisma.$transaction(async (transaction) => {
      const rows = []
      for (const eventDate of dates) {
        const row = await transaction.event.create({
          data: {
            userId: BigInt(actor.id),
            title: title.trim(),
            date: eventDate,
            time: typeof time === 'string' ? time : null,
            location: typeof location === 'string' ? location : null,
            isShared: typeof isShared === 'boolean' ? isShared : false,
            subjectId: asBigInt(subjectId),
            recurrence: parsedRecurrence,
            recurrenceGroupId,
          },
        })
        rows.push(row)
      }

      return rows
    })

    res.status(201).json({
      event: mapEvent(created[0]),
      occurrences: created.map(mapEvent),
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/events/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const existing = await prisma.event.findFirst({ where: { id: eventId, userId: BigInt(actor.id) } })
    if (!existing) {
      res.status(404).json({ error: 'Udalost nebyla nalezena.' })
      return
    }

    const payload = req.body as {
      title?: string
      date?: string
      time?: string | null
      location?: string | null
      subjectId?: number | null
      recurrence?: EventRecurrence
      isShared?: boolean
    }

    const parsedDate =
      typeof payload.date === 'string' ? new Date(payload.date) : undefined

    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatny format data.' })
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
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
        recurrence:
          payload.recurrence !== undefined
            ? (parseEventRecurrence(payload.recurrence) ?? undefined)
            : undefined,
      },
    })

    res.json(mapEvent(updated))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/events/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const existing = await prisma.event.findFirst({ where: { id: eventId, userId: BigInt(actor.id), deletedAt: null } })
    if (!existing) {
      res.status(404).json({ error: 'Udalost nebyla nalezena.' })
      return
    }

    await prisma.event.update({ where: { id: eventId }, data: { deletedAt: new Date() } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.put('/api/events', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { events } = req.body as { events?: unknown[] }

    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Neplatny payload: ocekava se pole events.' })
      return
    }

    const parsedEvents = events.map(parseIncomingEvent)
    if (parsedEvents.some((event) => event === null)) {
      res.status(400).json({ error: 'Neplatna struktura eventu.' })
      return
    }

    const typedEvents = parsedEvents as ApiEvent[]
    const existingEvents = await prisma.event.findMany({ where: { userId: BigInt(actor.id), deletedAt: null } })
    const existingById = new Map(existingEvents.map((event) => [event.id.toString(), event]))

    const incomingIdSet = new Set(typedEvents.map((event) => BigInt(event.id).toString()))

    await prisma.$transaction(async (transaction) => {
      // Zkontrolujeme existenci předmětů pro události
      const subjectIds = Array.from(new Set(typedEvents.map((e) => e.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = await transaction.subject.findMany({
        where: { id: { in: subjectIds.map((id) => BigInt(id)) } },
        select: { id: true }
      })
      const validSubjectIds = new Set(validSubjects.map((s) => s.id.toString()))

      for (const event of typedEvents) {
        const eventId = BigInt(event.id)
        const parsedDate = new Date(event.date)
        const existing = existingById.get(eventId.toString())
        let nextSubjectId = asBigInt(event.subjectId)

        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        await transaction.event.upsert({
          where: { id: eventId },
          update: {
            userId: BigInt(actor.id),
            title: event.title,
            date: parsedDate,
            time: event.time,
            location: event.location,
            isShared: typeof event.isShared === 'boolean' ? event.isShared : false,
            subjectId: nextSubjectId,
            recurrence: 'NONE',
            recurrenceGroupId: null,
            deletedAt: null,
          },
          create: {
            id: eventId,
            userId: BigInt(actor.id),
            title: event.title,
            date: parsedDate,
            time: event.time,
            location: event.location,
            isShared: typeof event.isShared === 'boolean' ? event.isShared : false,
            subjectId: nextSubjectId,
            recurrence: 'NONE',
            recurrenceGroupId: null,
            deletedAt: null,
          },
        })

        if (existing && existing.deletedAt) {
          await transaction.event.update({
            where: { id: eventId },
            data: { deletedAt: null },
          })
        }
      }

      const removedEvents = existingEvents.filter((event) => !incomingIdSet.has(event.id.toString()))

      if (removedEvents.length > 0) {
        await transaction.event.updateMany({
          where: {
            id: {
              in: removedEvents.map((event) => event.id),
            },
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    })

    const finalEvents = await prisma.event.findMany({
      where: { userId: BigInt(actor.id), deletedAt: null },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ success: true, events: finalEvents.map(mapEvent) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/files', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 25, maxLimit: 100 })
    const subjectId = asBigInt(req.query.subjectId)
    const lessonId = asBigInt(req.query.lessonId)
    const shared = req.query.shared
    const includeDeleted = req.query.includeDeleted === 'true'

    const findArgs: Prisma.FileRecordFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      where: isPublicActor(actor)
        ? {
            subjectId: subjectId ?? undefined,
            lessonId: lessonId ?? undefined,
            isShared: true,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            lessonId: lessonId ?? undefined,
            isShared: shared === 'true' ? true : shared === 'false' ? false : undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [{ userId: BigInt(actor.id) }, { isShared: true }],
          },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const files = await prisma.fileRecord.findMany(findArgs)
    const mappedFiles = files.map(mapFileRecord)

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

app.get('/api/files/public', async (_req, res, next) => {
  try {
    const files = await prisma.fileRecord.findMany({
      where: {
        isShared: true,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/files', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) {
      return
    }

    const includeDeleted = req.query.includeDeleted === 'true'
    const files = await prisma.fileRecord.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/files/:id/moderation', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const payload = req.body as { isShared?: boolean; deleted?: boolean }
    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const updated = await prisma.fileRecord.update({
      where: { id: fileId },
      data: {
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
        deletedAt:
          payload.deleted === true
            ? new Date()
            : payload.deleted === false
              ? null
              : undefined,
      },
    })

    res.json(mapFileRecord(updated))
  } catch (error) {
    next(error)
  }
})

app.post('/api/files/upload-url', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const { filename, contentType } = req.body as { filename?: string; contentType?: string }
    if (!filename || !contentType) {
      res.status(400).json({ error: 'Chybi filename nebo contentType.' })
      return
    }

    const fileKey = `${uuidv4()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const fileUrl = s3Endpoint 
      ? `${s3Endpoint}/${BUCKET_NAME}/${fileKey}`
      : `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || 'eu-west-1'}.amazonaws.com/${fileKey}`

    res.json({ uploadUrl, fileKey, fileUrl })
  } catch (error) {
    next(error)
  }
})

app.post('/api/files', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const { name, size, addedLabel, shared, isShared, subjectId, lessonId, fileKey, fileUrl } = req.body as {
      name?: string
      size?: string | number
      addedLabel?: string
      shared?: boolean
      isShared?: boolean
      subjectId?: number | null
      lessonId?: number | null
      fileKey?: string | null
      fileUrl?: string | null
    }

    if (!name?.trim()) {
      res.status(400).json({ error: 'Pole name je povinne.' })
      return
    }

    const parsedSize = parseFileSizeToBytes(size)
    if (parsedSize === undefined || parsedSize === null) {
      res.status(400).json({ error: 'Pole size musi byt cislo nebo text typu "2.4 MB".' })
      return
    }

    const created = await prisma.fileRecord.create({
      data: {
        userId: BigInt(actor.id),
        subjectId: asBigInt(subjectId),
        lessonId: asBigInt(lessonId),
        name: name.trim(),
        size: parsedSize,
        addedLabel: typeof addedLabel === 'string' ? addedLabel : 'Added now',
        isShared: typeof isShared === 'boolean' ? isShared : typeof shared === 'boolean' ? shared : false,
        fileKey: typeof fileKey === 'string' ? fileKey : null,
        fileUrl: typeof fileUrl === 'string' ? fileUrl : null,
      },
    })

    res.status(201).json(mapFileRecord(created))
  } catch (error) {
    next(error)
  }
})

app.put('/api/files/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tento soubor.' })
      return
    }

    const { name, size, addedLabel, shared, isShared, subjectId, lessonId } = req.body as {
      name?: string
      size?: string | number
      addedLabel?: string
      shared?: boolean
      isShared?: boolean
      subjectId?: number | null
      lessonId?: number | null
    }

    const parsedSize = parseFileSizeToBytes(size)
    if (size !== undefined && parsedSize === undefined) {
      res.status(400).json({ error: 'Neplatna velikost souboru.' })
      return
    }

    const updated = await prisma.fileRecord.update({
      where: { id: fileId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        size: parsedSize === null ? undefined : parsedSize,
        addedLabel: typeof addedLabel === 'string' ? addedLabel : undefined,
        isShared:
          typeof isShared === 'boolean'
            ? isShared
            : typeof shared === 'boolean'
              ? shared
              : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        lessonId: lessonId !== undefined ? asBigInt(lessonId) : undefined,
      },
    })

    res.json(mapFileRecord(updated))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/files/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento soubor.' })
      return
    }

    await prisma.fileRecord.update({ where: { id: fileId }, data: { deletedAt: new Date() } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/files/:id/comments', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const file = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canRead = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit komentare tohoto souboru.' })
      return
    }

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      comments.map((comment) => ({
        id: Number(comment.id),
        fileId: Number(comment.fileId),
        userId: Number(comment.userId),
        comment: comment.comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/files/:id/comments', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const { comment } = req.body as { comment?: string }
    if (!comment?.trim()) {
      res.status(400).json({ error: 'Pole comment je povinne.' })
      return
    }

    const file = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canComment = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canComment) {
      res.status(403).json({ error: 'Nemate opravneni komentovat tento soubor.' })
      return
    }

    const created = await prisma.fileComment.create({
      data: {
        fileId,
        userId: BigInt(actor.id),
        comment: comment.trim(),
      },
    })

    res.status(201).json({
      id: Number(created.id),
      fileId: Number(created.fileId),
      userId: Number(created.userId),
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/file-comments/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const commentId = asBigInt(req.params.id)
    if (!commentId) {
      res.status(400).json({ error: 'Neplatne ID komentare.' })
      return
    }

    const { comment } = req.body as { comment?: string }
    if (!comment?.trim()) {
      res.status(400).json({ error: 'Pole comment je povinne.' })
      return
    }

    const existing = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: {
        file: {
          select: {
            userId: true,
          },
        },
      },
    })
    if (!existing) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canEdit =
      existing.userId === BigInt(actor.id) || existing.file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canEdit) {
      res.status(403).json({ error: 'Nemate opravneni upravit tento komentar.' })
      return
    }

    const updated = await prisma.fileComment.update({
      where: { id: commentId },
      data: { comment: comment.trim() },
    })

    res.json({
      id: Number(updated.id),
      fileId: Number(updated.fileId),
      userId: Number(updated.userId),
      comment: updated.comment,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/file-comments/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const commentId = asBigInt(req.params.id)
    if (!commentId) {
      res.status(400).json({ error: 'Neplatne ID komentare.' })
      return
    }

    const existing = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: {
        file: {
          select: {
            userId: true,
          },
        },
      },
    })
    if (!existing) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canDelete =
      existing.userId === BigInt(actor.id) || existing.file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento komentar.' })
      return
    }

    await prisma.fileComment.delete({ where: { id: commentId } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/lessons', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const subjectId = asBigInt(req.query.subjectId)
    const studyPlanId = asBigInt(req.query.studyPlanId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const lessons = await prisma.lesson.findMany({
      where: isPublicActor(actor)
        ? {
            subjectId: subjectId ?? undefined,
            studyPlanId: studyPlanId ?? undefined,
            isShared: true,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            studyPlanId: studyPlanId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [
              { isShared: true },
              { subject: { userId: BigInt(actor.id) } },
              { studyPlan: { userId: BigInt(actor.id) } },
              { studyPlan: { collaborators: { some: { userId: BigInt(actor.id) } } } },
            ],
          },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            notes: true,
            files: true,
          },
        },
      },
    })

    res.json(
      lessons.map((lesson) => ({
        id: Number(lesson.id),
        subjectId: asNumberId(lesson.subjectId),
        studyPlanId: asNumberId(lesson.studyPlanId),
        title: lesson.title,
        content: lesson.content,
        isShared: lesson.isShared,
        orderIndex: lesson.orderIndex,
        notesCount: lesson._count.notes,
        filesCount: lesson._count.files,
        deletedAt: lesson.deletedAt ? lesson.deletedAt.toISOString() : null,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/lessons', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const payload = req.body as {
      subjectId?: number | null
      studyPlanId?: number | null
      title?: string
      content?: string | null
      isShared?: boolean
      orderIndex?: number
    }

    if (!payload.title?.trim()) {
      res.status(400).json({ error: 'Pole title je povinne.' })
      return
    }

    const created = await prisma.lesson.create({
      data: {
        subjectId: asBigInt(payload.subjectId),
        studyPlanId: asBigInt(payload.studyPlanId),
        title: payload.title.trim(),
        content: typeof payload.content === 'string' ? payload.content : null,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : false,
        orderIndex: typeof payload.orderIndex === 'number' ? Math.trunc(payload.orderIndex) : 0,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      subjectId: asNumberId(created.subjectId),
      studyPlanId: asNumberId(created.studyPlanId),
      title: created.title,
      content: created.content,
      isShared: created.isShared,
      orderIndex: created.orderIndex,
      deletedAt: created.deletedAt,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/lessons/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!existing) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const ownsStudyPlan =
      existing.studyPlanId !== null
        ? (await prisma.studyPlan.findFirst({ where: { id: existing.studyPlanId, userId: BigInt(actor.id) } })) !==
          null
        : false

    const ownsSubject =
      existing.subjectId !== null
        ? (await prisma.subject.findFirst({ where: { id: existing.subjectId, userId: BigInt(actor.id) } })) !== null
        : false

    const canEditLesson = actor.role === 'ADMIN' || ownsStudyPlan || ownsSubject

    if (!canEditLesson) {
      res.status(403).json({ error: 'Nemate opravneni upravit tuto lekci.' })
      return
    }

    const payload = req.body as {
      subjectId?: number | null
      studyPlanId?: number | null
      title?: string
      content?: string | null
      isShared?: boolean
      orderIndex?: number
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
        studyPlanId: payload.studyPlanId !== undefined ? asBigInt(payload.studyPlanId) : undefined,
        title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
        content:
          typeof payload.content === 'string'
            ? payload.content
            : payload.content === null
              ? null
              : undefined,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
        orderIndex: typeof payload.orderIndex === 'number' ? Math.trunc(payload.orderIndex) : undefined,
      },
    })

    res.json({
      id: Number(updated.id),
      subjectId: asNumberId(updated.subjectId),
      studyPlanId: asNumberId(updated.studyPlanId),
      title: updated.title,
      content: updated.content,
      isShared: updated.isShared,
      orderIndex: updated.orderIndex,
      deletedAt: updated.deletedAt,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/lessons/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!existing || existing.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const ownsStudyPlan =
      existing.studyPlanId !== null
        ? (await prisma.studyPlan.findFirst({ where: { id: existing.studyPlanId, userId: BigInt(actor.id) } })) !==
          null
        : false

    const ownsSubject =
      existing.subjectId !== null
        ? (await prisma.subject.findFirst({ where: { id: existing.subjectId, userId: BigInt(actor.id) } })) !== null
        : false

    const canDeleteLesson = actor.role === 'ADMIN' || ownsStudyPlan || ownsSubject

    if (!canDeleteLesson) {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto lekci.' })
      return
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/lessons/:id/notes', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    if (isPublicActor(actor)) {
      if (!lesson.isShared) {
        res.status(403).json({ error: 'Verejnost vidi jen verejne poznamky.' })
        return
      }

      const publicNotes = await prisma.lessonNote.findMany({
        where: { lessonId },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      })

      res.json(
        publicNotes.map((note) => ({
          id: Number(note.id),
          lessonId: Number(note.lessonId),
          userId: Number(note.userId),
          note: note.note,
          isPinned: note.isPinned,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        })),
      )
      return
    }

    const includeAll = req.query.includeAll === 'true' && actor.role === 'ADMIN'

    const notes = await prisma.lessonNote.findMany({
      where: {
        lessonId,
        userId: includeAll ? undefined : BigInt(actor.id),
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    })

    res.json(
      notes.map((note) => ({
        id: Number(note.id),
        lessonId: Number(note.lessonId),
        userId: Number(note.userId),
        note: note.note,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/lessons/:id/notes', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const payload = req.body as { note?: string; isPinned?: boolean }
    if (!payload.note?.trim()) {
      res.status(400).json({ error: 'Pole note je povinne.' })
      return
    }

    const created = await prisma.lessonNote.create({
      data: {
        lessonId,
        userId: BigInt(actor.id),
        note: payload.note.trim(),
        isPinned: typeof payload.isPinned === 'boolean' ? payload.isPinned : false,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      lessonId: Number(created.lessonId),
      userId: Number(created.userId),
      note: created.note,
      isPinned: created.isPinned,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/lesson-notes/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tuto poznamku.' })
      return
    }

    const payload = req.body as { note?: string; isPinned?: boolean }

    const updated = await prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        note: typeof payload.note === 'string' ? payload.note.trim() : undefined,
        isPinned: typeof payload.isPinned === 'boolean' ? payload.isPinned : undefined,
      },
    })

    res.json({
      id: Number(updated.id),
      lessonId: Number(updated.lessonId),
      userId: Number(updated.userId),
      note: updated.note,
      isPinned: updated.isPinned,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/lesson-notes/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto poznamku.' })
      return
    }

    await prisma.lessonNote.delete({ where: { id: noteId } })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/annotations', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const targetType = parseAnnotationTargetType(req.query.targetType)
    const targetId = asBigInt(req.query.targetId)

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Pole targetType a targetId jsou povinna.' })
      return
    }

    const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit anotace tohoto obsahu.' })
      return
    }

    const annotations = await prisma.textAnnotation.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      annotations.map((annotation) => ({
        id: Number(annotation.id),
        targetType: annotation.targetType,
        targetId: Number(annotation.targetId),
        userId: Number(annotation.userId),
        startOffset: annotation.startOffset,
        endOffset: annotation.endOffset,
        selectedText: annotation.selectedText,
        comment: annotation.comment,
        createdAt: annotation.createdAt.toISOString(),
        updatedAt: annotation.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/annotations', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const payload = req.body as {
      targetType?: AnnotationTargetType
      targetId?: number | string
      startOffset?: number
      endOffset?: number
      selectedText?: string
      comment?: string
    }

    const targetType = parseAnnotationTargetType(payload.targetType)
    const targetId = asBigInt(payload.targetId)
    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Pole targetType a targetId jsou povinna.' })
      return
    }

    if (
      typeof payload.startOffset !== 'number' ||
      typeof payload.endOffset !== 'number' ||
      payload.startOffset < 0 ||
      payload.endOffset < payload.startOffset
    ) {
      res.status(400).json({ error: 'Neplatny interval oznaceni textu.' })
      return
    }

    if (!payload.selectedText?.trim() || !payload.comment?.trim()) {
      res.status(400).json({ error: 'Pole selectedText a comment jsou povinna.' })
      return
    }

    const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni komentovat tento obsah.' })
      return
    }

    const created = await prisma.textAnnotation.create({
      data: {
        targetType,
        targetId,
        userId: BigInt(actor.id),
        startOffset: Math.trunc(payload.startOffset),
        endOffset: Math.trunc(payload.endOffset),
        selectedText: payload.selectedText.trim(),
        comment: payload.comment.trim(),
      },
    })

    res.status(201).json({
      id: Number(created.id),
      targetType: created.targetType,
      targetId: Number(created.targetId),
      userId: Number(created.userId),
      startOffset: created.startOffset,
      endOffset: created.endOffset,
      selectedText: created.selectedText,
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/annotations/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const annotationId = asBigInt(req.params.id)
    if (!annotationId) {
      res.status(400).json({ error: 'Neplatne ID anotace.' })
      return
    }

    const annotation = await prisma.textAnnotation.findUnique({ where: { id: annotationId } })
    if (!annotation) {
      res.status(404).json({ error: 'Anotace nebyla nalezena.' })
      return
    }

    if (annotation.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto anotaci.' })
      return
    }

    await prisma.textAnnotation.delete({ where: { id: annotationId } })
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
    (error as { code?: string }).code === 'P2002'
  ) {
    res.status(409).json({ error: 'Konflikt unikatnich dat (pravdepodobne duplicitni code nebo email).' })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Interni chyba serveru' })
})

const start = async () => {
  try {
    await prisma.$connect()
    app.listen(PORT, () => {
      console.log(`Server bezi na http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Nepodarilo se pripojit k databazi:', error)
    process.exit(1)
  }
}

void start()

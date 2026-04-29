import { AnnotationTargetType, CollaborationRole, EventRecurrence, TaskPriority, UserRole } from '@prisma/client'
import express from 'express'
import { ApiEvent, ApiTask, CursorPagination } from './types.js'

export const asBigInt = (value: unknown): bigint | null => {
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

export const asNumberId = (value: bigint | null | undefined): number | null => {
  if (typeof value !== 'bigint') {
    return null
  }
  const numeric = Number(value)
  return Number.isSafeInteger(numeric) ? numeric : null
}

export const toDateOnlyIso = (value: Date) => value.toISOString().slice(0, 10)

export const parseOptionalDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export const parseTaskPriority = (value: unknown): TaskPriority | undefined => {
  if (value === 'NONE' || value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
    return value as TaskPriority
  }
  return undefined
}

export const parseUserRole = (value: unknown): UserRole | undefined => {
  if (value === 'REGISTERED' || value === 'ADMIN') return value as UserRole
  return undefined
}

export const parseEventRecurrence = (value: unknown): EventRecurrence | undefined => {
  if (value === 'NONE' || value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY') return value as EventRecurrence
  return undefined
}

export const parseCollaborationRole = (value: unknown): CollaborationRole | undefined => {
  if (value === 'VIEWER' || value === 'CONTRIBUTOR') return value as CollaborationRole
  return undefined
}

export const parseAnnotationTargetType = (value: unknown): AnnotationTargetType | undefined => {
  if (value === 'LESSON' || value === 'LESSON_NOTE' || value === 'FILE_COMMENT') return value as AnnotationTargetType
  return undefined
}

export const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export const buildRecurringDates = (baseDate: Date, recurrence: EventRecurrence, repeatCount: number): Date[] => {
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

export const parseFileSizeToBytes = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10)
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)
  if (!match) return undefined
  const amount = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'KB') return Math.round(amount * 1024)
  if (unit === 'MB') return Math.round(amount * 1024 * 1024)
  return Math.round(amount * 1024 * 1024 * 1024)
}

export const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`
  }
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

export const inferFileCategory = (fileName: string): 'folder' | 'pdf' | 'image' | 'document' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') return 'image'
  if (ext === 'doc' || ext === 'docx' || ext === 'txt' || ext === 'rtf' || ext === 'ppt' || ext === 'pptx') return 'document'
  return 'other'
}

export const mapTask = (task: any): ApiTask & { userId: number, studyPlanId: number | null, favorite: boolean, tag: string | null, deadline: string | null, deletedAt: string | null } => ({
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

export const mapEvent = (event: any): ApiEvent & { userId: number, deletedAt: string | null } => ({
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

export const mapFileRecord = (file: any) => ({
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

export const parseCursorPagination = (req: express.Request, options?: { defaultLimit?: number, maxLimit?: number }): CursorPagination => {
  const defaultLimit = options?.defaultLimit ?? 25
  const maxLimit = options?.maxLimit ?? 100
  const enabled = req.query.paginated === 'true' || req.query.cursor !== undefined || req.query.limit !== undefined
  const rawLimit = Number(req.query.limit ?? defaultLimit)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.trunc(rawLimit)), maxLimit) : defaultLimit
  return { enabled, limit, cursor: asBigInt(req.query.cursor) }
}

export const toPaginatedPayload = <T extends { id: number }>(rows: T[], limit: number) => {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  return {
    data,
    hasMore,
    nextCursor: hasMore && data.length > 0 ? String(data[data.length - 1].id) : null,
  }
}
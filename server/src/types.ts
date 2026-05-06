import { type EventRecurrence, type UserRole } from './db/schema.js'

export type ApiTask = {
  id: number
  title: string
  done: boolean
  subjectId: number | null
  tag?: string | null
}

export type ApiEvent = {
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

export type AuthActor = {
  id: number
  fullName: string
  email: string
  role: UserRole | 'PUBLIC'
}

export type CursorPagination = {
  enabled: boolean
  limit: number
  cursor: bigint | null
}
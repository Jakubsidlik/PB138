import { type UserRole } from './db/schema'

export type ApiTask = {
  id: number
  title: string
  done: boolean
  priority?: string | null
}

export type ApiEvent = {
  id: number
  title: string
  date: string
  time: string | null
  location: string | null
  isShared?: boolean
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
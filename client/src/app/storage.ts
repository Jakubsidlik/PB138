import {
  AccentPalette,
  CalendarEvent,
  Task,
  ThemeMode,
  UserProfile,
} from './types'
import {
  EVENTS_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  userProfileSeed,
} from './data'

const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const task = value as Task
  return (
    typeof task.id === 'number' &&
    typeof task.title === 'string' &&
    typeof task.done === 'boolean'
  )
}

const isCalendarEvent = (value: unknown): value is CalendarEvent => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const event = value as CalendarEvent
  return (
    typeof event.id === 'number' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string'
  )
}

const isProfilePayload = (value: unknown): value is Partial<UserProfile> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const profile = value as Partial<UserProfile>

  return (
    typeof profile.fullName === 'string' &&
    (typeof profile.email === 'string' || profile.email === undefined) &&
    (typeof profile.school === 'string' || profile.school === undefined) &&
    (typeof profile.studyMajor === 'string' || profile.studyMajor === undefined) &&
    (typeof profile.studyYear === 'string' || profile.studyYear === undefined) &&
    (typeof profile.studyType === 'string' || profile.studyType === undefined) &&
    (typeof profile.avatarDataUrl === 'string' || profile.avatarDataUrl === null)
  )
}

export const readTasksFromStorage = (): Task[] | null => {
  const raw = localStorage.getItem(TASKS_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isTask)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

export const readEventsFromStorage = (): CalendarEvent[] | null => {
  const raw = localStorage.getItem(EVENTS_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isCalendarEvent)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

export const readThemeFromStorage = (): ThemeMode => {
  const raw = localStorage.getItem(THEME_STORAGE_KEY)
  return raw === 'dark' ? 'dark' : 'light'
}

export const readPaletteFromStorage = (): AccentPalette => {
  const raw = localStorage.getItem(PALETTE_STORAGE_KEY)

  if (
    raw === 'emerald' ||
    raw === 'violet' ||
    raw === 'rose' ||
    raw === 'red' ||
    raw === 'amber' ||
    raw === 'orange' ||
    raw === 'cyan' ||
    raw === 'mono'
  ) {
    return raw
  }

  return 'blue'
}

export const readProfileFromStorage = (): UserProfile | null => {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (isProfilePayload(parsed)) {
      return {
        ...userProfileSeed,
        ...parsed,
      }
    }
  } catch {
    return null
  }

  return null
}

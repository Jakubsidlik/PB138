import {
  AccentPalette,
  CalendarEvent,
  Task,
  ThemeMode,
} from './types'
import {
  EVENTS_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
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

  if (raw === 'emerald' || raw === 'violet' || raw === 'rose') {
    return raw
  }

  return 'blue'
}

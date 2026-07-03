import { AccentPalette, ThemeMode, UserProfile } from './types'
import { PALETTE_STORAGE_KEY, THEME_STORAGE_KEY, PROFILE_STORAGE_KEY } from './data'

export const readThemeFromStorage = (): ThemeMode => {
  const t = localStorage.getItem(THEME_STORAGE_KEY)
  if (t === 'light' || t === 'dark') return t
  return 'dark'
}

export const readPaletteFromStorage = (): AccentPalette => {
  const p = localStorage.getItem(PALETTE_STORAGE_KEY)
  if (p && p.startsWith('yellow-') || p?.startsWith('mono-')) return p as AccentPalette
  return 'yellow-1'
}

export const readProfileFromStorage = (): UserProfile | null => {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      role: parsed.role || 'REGISTERED',
      school: parsed.school || null,
      studyMajor: parsed.studyMajor || null,
      studyYear: parsed.studyYear || null,
      studyType: parsed.studyType || null,
      avatarDataUrl: parsed.avatarDataUrl || null,
    } as UserProfile
  } catch {
    return null
  }
}

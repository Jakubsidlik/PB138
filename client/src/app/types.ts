export type Subject = {
  id: number
  name: string
  teacher: string
  code: string
  files: number
  notes: number
  archived?: boolean
  tasks?: number
  events?: number
}

export type ScheduleItem = {
  id: number
  time: string
  subject: string
  type: string
  location: string
}

export type StudyFile = {
  id: number
  subject: string
  name: string
  size: string
}

export type FileCategory = 'folder' | 'pdf' | 'image' | 'document' | 'other'
export type FileTab = 'all' | 'recent' | 'shared'

export type ManagedFile = {
  id: number
  name: string
  size: string
  addedLabel: string
  category: FileCategory
  shared: boolean
  subjectId?: number | null
}

export type FileFolder = {
  id: number
  name: string
  filesCount: number
  color: 'amber' | 'emerald' | 'primary' | 'slate'
}

export type Task = {
  id: number
  title: string
  done: boolean
  subjectId?: number | null
}

export type CalendarEvent = {
  id: number
  title: string
  date: string
  subjectId?: number | null
  time?: string | null
  location?: string | null
  icon?: string | null
  accent?: 'primary' | 'amber' | 'emerald' | null
}

export type EventMeta = {
  time: string
  location: string
  icon: string
  accent: 'primary' | 'amber' | 'emerald'
}

export type ThemeMode = 'light' | 'dark'
export type AccentPalette =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'red'
  | 'amber'
  | 'orange'
  | 'cyan'
  | 'mono'
export type MobileNavItem = 'home' | 'calendar' | 'subjects' | 'files' | 'profile'

export type UserProfile = {
  fullName: string
  email: string
  school: string
  studyMajor: string
  studyYear: string
  studyType: string
  avatarDataUrl: string | null
}

export type SubjectVisual = {
  icon: string
  tone: 'blue' | 'emerald' | 'violet' | 'amber'
}

export type DesktopSubjectTone = 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan'

export type DesktopSubjectMeta = {
  icon: string
  tone: DesktopSubjectTone
}

export type CalendarCell = {
  date: Date
  iso: string
  inCurrentMonth: boolean
}

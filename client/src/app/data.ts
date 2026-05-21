import {
  CalendarEvent,
  DesktopSubjectMeta,
  EventMeta,
  FileFolder,
  Subject,
  SubjectVisual,
  Task,
  UserProfile,
  Lesson,
  StudyPlan,
  ManagedFile,
} from './types'

export const TASKS_STORAGE_KEY = 'pb138.tasks'
export const EVENTS_STORAGE_KEY = 'pb138.events'
export const THEME_STORAGE_KEY = 'pb138.theme'
export const PALETTE_STORAGE_KEY = 'pb138.palette'
export const PROFILE_STORAGE_KEY = 'pb138.profile'

// STUDY PLANS - Studijní plány
export const studyPlansSeed: StudyPlan[] = []

// SUBJECTS - Předměty
export const subjectsSeed: Subject[] = []

// LESSONS - Lekce
export const lessonsSeed: Lesson[] = []

export const foldersSeed: FileFolder[] = []

export const managedFilesSeed: ManagedFile[] = []

export const tasksSeed: Task[] = []

export const eventsSeed: CalendarEvent[] = []

export const eventMetaSeed: Record<number, EventMeta> = {}

export const subjectVisualByCode: Record<string, SubjectVisual> = {
  SE: { icon: '🧩', tone: 'blue' },
  AI: { icon: '🧠', tone: 'emerald' },
  DS: { icon: '🧮', tone: 'violet' },
}

export const desktopSubjectMetaByCode: Record<string, DesktopSubjectMeta> = {
  SE: { icon: '🧩', tone: 'blue' },
  AI: { icon: '🧠', tone: 'emerald' },
  DS: { icon: '💻', tone: 'violet' },
}

export const calendarWeekDays = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

export const userProfileSeed: UserProfile = {
  fullName: '',
  email: '',
  school: 'Masarykova Univerzita',
  studyMajor: 'Aplikovaná informatika',
  studyYear: '2.',
  studyType: 'Bakalářské',
  avatarDataUrl: null,
}

import {
  CalendarEvent,
  DesktopSubjectMeta,
  EventMeta,
  FileComment,
  FileFolder,
  Subject,
  SubjectVisual,
  Task,
  UserProfile,
  Lesson,
  LessonNote,
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

// TAGS (dříve Subject) - Předměty/Tagy
export const subjectsSeed: Subject[] = []

// LESSONS - Lekce
export const lessonsSeed: Lesson[] = []

// LESSON NOTES - Poznámky k lekcím
export const lessonNotesSeed: LessonNote[] = []

// LESSON COMMENTS - Komentáře k poznámkám
export const lessonCommentsSeed: FileComment[] = []

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

export const calendarWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const userProfileSeed: UserProfile = {
  fullName: '',
  email: '',
  school: '',
  studyMajor: '',
  studyYear: '',
  studyType: '',
  avatarDataUrl: null,
}

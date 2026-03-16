import {
  CalendarEvent,
  DesktopSubjectMeta,
  EventMeta,
  FileFolder,
  ManagedFile,
  ScheduleItem,
  StudyFile,
  Subject,
  SubjectVisual,
  Task,
  UserProfile,
} from './types'

export const TASKS_STORAGE_KEY = 'pb138.tasks'
export const EVENTS_STORAGE_KEY = 'pb138.events'
export const THEME_STORAGE_KEY = 'pb138.theme'
export const PALETTE_STORAGE_KEY = 'pb138.palette'
export const PROFILE_STORAGE_KEY = 'pb138.profile'

export const subjectsSeed: Subject[] = [
  {
    id: 1,
    name: 'Software Engineering',
    teacher: 'PROF. ANDERSON',
    code: 'SE',
    files: 12,
    notes: 48,
  },
  {
    id: 2,
    name: 'Artificial Intelligence',
    teacher: 'PROF. MILES',
    code: 'AI',
    files: 8,
    notes: 32,
  },
  {
    id: 3,
    name: 'Data Structures',
    teacher: 'PROF. SMITH',
    code: 'DS',
    files: 15,
    notes: 56,
  },
]

export const scheduleSeed: ScheduleItem[] = [
  {
    id: 1,
    time: '09:00 - 10:30',
    subject: 'Software Engineering',
    type: 'Lecture',
    location: 'Hall B-12',
  },
  {
    id: 2,
    time: '11:00 - 12:30',
    subject: 'Artificial Intelligence',
    type: 'Live Now',
    location: 'Zoom',
  },
  {
    id: 3,
    time: '14:00 - 15:30',
    subject: 'Data Structures',
    type: 'Workshop',
    location: 'Lab 402',
  },
]

export const filesSeed: StudyFile[] = [
  { id: 1, subject: 'SE', name: 'Lecture_05_Software_Design.pdf', size: '2.4 MB' },
  { id: 2, subject: 'AI', name: 'Neural_Networks_Notes.docx', size: '780 KB' },
  { id: 3, subject: 'DS', name: 'Heap_Exercises.zip', size: '1.1 MB' },
]

export const foldersSeed: FileFolder[] = [
  { id: 1, name: 'Mathematics', filesCount: 12, color: 'amber' },
  { id: 2, name: 'Biology', filesCount: 8, color: 'emerald' },
  { id: 3, name: 'Study Group', filesCount: 24, color: 'primary' },
  { id: 4, name: 'Archives', filesCount: 105, color: 'slate' },
]

export const managedFilesSeed: ManagedFile[] = [
  {
    id: 1,
    name: 'Assignment_v1.pdf',
    size: '2.4 MB',
    addedLabel: 'Added 2h ago',
    category: 'pdf',
    shared: true,
  },
  {
    id: 2,
    name: 'Project_Proposal.docx',
    size: '1.1 MB',
    addedLabel: 'Added yesterday',
    category: 'document',
    shared: false,
  },
]

export const tasksSeed: Task[] = [
  { id: 1, title: 'Dokončit Data Structures essay', done: false },
  { id: 2, title: 'Přečíst materiály na AI cvičení', done: true },
  { id: 3, title: 'Nahrát zápisky z přednášky SE', done: false },
  { id: 4, title: 'Zkontrolovat termíny deadlinů', done: true },
]

export const eventsSeed: CalendarEvent[] = [
  { id: 1, title: 'Data Structures Essay Deadline', date: '2026-03-18' },
  { id: 2, title: 'AI Lecture', date: '2026-03-19' },
  { id: 3, title: 'SE Exercise', date: '2026-03-20' },
]

export const eventMetaSeed: Record<number, EventMeta> = {
  1: {
    time: '09:00 AM - 10:30 AM',
    location: 'Science Building, Room 402',
    icon: '🧮',
    accent: 'primary',
  },
  2: {
    time: '01:00 PM - 03:00 PM',
    location: 'Main Lab, Block C',
    icon: '🧪',
    accent: 'amber',
  },
  3: {
    time: '04:30 PM - 05:30 PM',
    location: 'Student Union Lounge',
    icon: '👥',
    accent: 'emerald',
  },
}

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
  fullName: 'Jakub Kowalski',
  email: 'jakub.kowalski@muni.cz',
  school: 'Masarykova univerzita',
  studyMajor: 'Informatika',
  studyYear: '3. ročník',
  studyType: 'Bakalářské studium',
  avatarDataUrl: null,
}

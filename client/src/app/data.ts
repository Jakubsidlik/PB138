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
} from './types'

export const TASKS_STORAGE_KEY = 'pb138.tasks'
export const EVENTS_STORAGE_KEY = 'pb138.events'
export const THEME_STORAGE_KEY = 'pb138.theme'
export const PALETTE_STORAGE_KEY = 'pb138.palette'
export const PROFILE_STORAGE_KEY = 'pb138.profile'

// STUDY PLANS - Studijní plány
export const studyPlansSeed: StudyPlan[] = [
  {
    id: 1,
    userId: 1,
    name: 'Zimní semestr 2025/26',
    description: 'Plán studií pro zimní semestr Informatiky',
    startDate: '2025-09-01',
    endDate: '2026-01-31',
    isActive: true,
    subjectsCount: 3,
    tasksCount: 8,
    lessonsCount: 24,
  },
  {
    id: 2,
    userId: 1,
    name: 'Letní semestr 2025/26',
    description: 'Plán studií pro letní semestr Informatiky',
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    isActive: false,
    subjectsCount: 3,
    tasksCount: 6,
    lessonsCount: 20,
  },
]

// TAGS (dříve Subject) - Předměty/Tagy
export const subjectsSeed: Subject[] = [
  {
    id: 1,
    userId: 1,
    studyPlanId: 1,
    name: 'Software Engineering',
    teacher: 'PROF. ANDERSON',
    code: 'SE',
    files: 12,
    notes: 48,
  },
  {
    id: 2,
    userId: 1,
    studyPlanId: 1,
    name: 'Artificial Intelligence',
    teacher: 'PROF. MILES',
    code: 'AI',
    files: 8,
    notes: 32,
  },
  {
    id: 3,
    userId: 1,
    studyPlanId: 1,
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

// LESSONS - Lekce
export const lessonsSeed: Lesson[] = [
  {
    id: 1,
    subjectId: 1,
    studyPlanId: 1,
    title: 'Introduction to Software Engineering',
    content: 'Overview of software development lifecycle, methodologies, and best practices.',
    orderIndex: 1,
    notesCount: 3,
  },
  {
    id: 2,
    subjectId: 1,
    studyPlanId: 1,
    title: 'Design Patterns',
    content: 'Deep dive into common design patterns and their applications.',
    orderIndex: 2,
    notesCount: 5,
  },
  {
    id: 3,
    subjectId: 2,
    studyPlanId: 1,
    title: 'Machine Learning Basics',
    content: 'Introduction to machine learning concepts and algorithms.',
    orderIndex: 1,
    notesCount: 4,
  },
  {
    id: 4,
    subjectId: 2,
    studyPlanId: 1,
    title: 'Neural Networks',
    content: 'Comprehensive study of artificial neural networks.',
    orderIndex: 2,
    notesCount: 6,
  },
  {
    id: 5,
    subjectId: 3,
    studyPlanId: 1,
    title: 'Arrays and Linked Lists',
    content: 'Fundamental data structures and their operations.',
    orderIndex: 1,
    notesCount: 2,
  },
  {
    id: 6,
    subjectId: 3,
    studyPlanId: 1,
    title: 'Trees and Graphs',
    content: 'Advanced data structures for hierarchical and network data.',
    orderIndex: 2,
    notesCount: 4,
  },
]

// FILES - Soubory
export const filesSeed: StudyFile[] = [
  { id: 1, subject: 'SE', name: 'Lecture_05_Software_Design.pdf', size: '2.4 MB' },
  { id: 2, subject: 'AI', name: 'Neural_Networks_Notes.docx', size: '780 KB' },
  { id: 3, subject: 'DS', name: 'Heap_Exercises.zip', size: '1.1 MB' },
]

// LESSON NOTES - Poznámky k lekcím
export const lessonNotesSeed: LessonNote[] = [
  {
    id: 1,
    lessonId: 1,
    userId: 1,
    note: 'Software engineering involves systematic design and development of software. Key principles include modularity, maintainability, and scalability.',
    isPinned: true,
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-15T10:30:00Z',
  },
  {
    id: 2,
    lessonId: 1,
    userId: 1,
    note: 'SDLC phases: Planning, Analysis, Design, Implementation, Testing, Deployment, Maintenance',
    isPinned: false,
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 3,
    lessonId: 2,
    userId: 1,
    note: 'MVC pattern separates concerns into Model, View, and Controller layers.',
    isPinned: true,
    createdAt: '2026-01-22T09:00:00Z',
    updatedAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 4,
    lessonId: 3,
    userId: 1,
    note: 'Machine learning is a subset of AI that enables systems to learn from data.',
    isPinned: true,
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
  },
  {
    id: 5,
    lessonId: 4,
    userId: 1,
    note: 'Neural networks consist of interconnected neurons organized in layers.',
    isPinned: false,
    createdAt: '2026-02-05T15:30:00Z',
    updatedAt: '2026-02-05T15:30:00Z',
  },
]

// LESSON COMMENTS - Komentáře k poznámkám
export const lessonCommentsSeed: FileComment[] = [
  {
    id: 1,
    fileId: 1, // lessonNoteId: 1
    userId: 1,
    comment: 'Modularity je důležité pro údržbu kódu.',
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 2,
    fileId: 1, // lessonNoteId: 1
    userId: 1,
    comment: 'Souhlasím, měli bychom se zaměřit na jednotlivé komponenty.',
    createdAt: '2026-01-15T13:30:00Z',
    updatedAt: '2026-01-15T13:30:00Z',
  },
  {
    id: 3,
    fileId: 3, // lessonNoteId: 3
    userId: 1,
    comment: 'MVC je nejčastěji používaný pattern ve webovém vývoji.',
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-01-22T10:00:00Z',
  },
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
    userId: 1,
    subjectId: 1,
    name: 'Assignment_v1.pdf',
    size: '2.4 MB',
    sizeBytes: 2516582,
    addedLabel: 'Added 2h ago',
    category: 'pdf',
    shared: true,
    isShared: true,
  },
  {
    id: 2,
    userId: 1,
    subjectId: 2,
    name: 'Project_Proposal.docx',
    size: '1.1 MB',
    sizeBytes: 1153434,
    addedLabel: 'Added yesterday',
    category: 'document',
    shared: false,
    isShared: false,
  },
  {
    id: 3,
    userId: 1,
    subjectId: 3,
    name: 'Exam_Preparation.zip',
    size: '5.6 MB',
    sizeBytes: 5872025,
    addedLabel: 'Added 3 days ago',
    category: 'other',
    shared: true,
    isShared: true,
  },
]

export const tasksSeed: Task[] = [
  {
    id: 1,
    userId: 1,
    subjectId: 3,
    studyPlanId: 1,
    title: 'Dokončit Data Structures essay',
    done: false,
    favorite: true,
    priority: 'HIGH',
    deadline: '2026-03-18',
  },
  {
    id: 2,
    userId: 1,
    subjectId: 2,
    studyPlanId: 1,
    title: 'Přečíst materiály na AI cvičení',
    done: true,
    favorite: false,
    priority: 'MEDIUM',
    deadline: '2026-02-10',
  },
  {
    id: 3,
    userId: 1,
    subjectId: 1,
    studyPlanId: 1,
    title: 'Nahrát zápisky z přednášky SE',
    done: false,
    favorite: false,
    priority: 'LOW',
    deadline: '2026-02-20',
  },
  {
    id: 4,
    userId: 1,
    subjectId: null,
    studyPlanId: 1,
    title: 'Zkontrolovat termíny deadlinů',
    done: true,
    favorite: false,
    priority: 'URGENT',
    deadline: '2026-02-05',
  },
  {
    id: 5,
    userId: 1,
    subjectId: 1,
    studyPlanId: 1,
    title: 'Napsat projekt na Software Engineering',
    done: false,
    favorite: true,
    priority: 'URGENT',
    deadline: '2026-03-25',
  },
]

export const eventsSeed: CalendarEvent[] = [
  {
    id: 1,
    userId: 1,
    title: 'Data Structures Essay Deadline',
    date: '2026-03-18',
    time: '23:59',
    location: 'Online submission',
    subjectId: 3,
  },
  {
    id: 2,
    userId: 1,
    title: 'AI Lecture',
    date: '2026-03-19',
    time: '09:00',
    location: 'Main Lab, Block C',
    subjectId: 2,
  },
  {
    id: 3,
    userId: 1,
    title: 'SE Exercise',
    date: '2026-03-20',
    time: '14:00',
    location: 'Lab 402',
    subjectId: 1,
  },
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

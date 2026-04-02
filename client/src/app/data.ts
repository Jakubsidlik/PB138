import {
  CalendarEvent,
  AppScreen,
  DesktopSubjectMeta,
  EventMeta,
  FileFolder,
  ManagedFile,
  ScheduleItem,
  Lesson,
  StudyFile,
  Subject,
  SubjectVisual,
  Task,
  Event,
  PlannerSubject,
  PlannerUser,
  RoleCapability,
  UserRole,
  UserProfile,
} from './types'

export const TASKS_STORAGE_KEY = 'pb138.tasks'
export const EVENTS_STORAGE_KEY = 'pb138.events'
export const THEME_STORAGE_KEY = 'pb138.theme'
export const PALETTE_STORAGE_KEY = 'pb138.palette'
export const PROFILE_STORAGE_KEY = 'pb138.profile'
export const ROLE_STORAGE_KEY = 'pb138.role'

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

export const roleLabels: Record<UserRole, string> = {
  student: 'Student - správce',
  registered: 'Registrovaný uživatel',
  public: 'Veřejnost',
}

export const roleCapabilities: Record<UserRole, RoleCapability[]> = {
  student: [
    { label: 'Správa všeho', description: 'Může vytvářet, upravovat a mazat předměty, lekce i události.' },
    { label: 'Publikování', description: 'Určuje, co je veřejné a co zůstává jen pro registrované.' },
    { label: 'Koordinace', description: 'Vidí všechny uživatele a řídí strukturu kurzu.' },
  ],
  registered: [
    { label: 'Čtení sdíleného obsahu', description: 'Zobrazuje sdílené předměty, lekce a události.' },
    { label: 'Ukládání oblíbených', description: 'Může si označovat veřejné předměty jako sledované.' },
    { label: 'Přehled kalendáře', description: 'Vidí časovou osu sdílených aktivit bez editace.' },
  ],
  public: [
    { label: 'Veřejný náhled', description: 'Zobrazuje pouze obsah označený jako veřejný.' },
    { label: 'Bez editace', description: 'Nemůže nic vytvářet ani upravovat.' },
    { label: 'Časová osa', description: 'Může číst veřejné lekce a události na kalendáři.' },
  ],
}

export const plannerUsersSeed: PlannerUser[] = [
  {
    id: 1,
    name: 'User',
    email: 'user@example.com',
    role: 'student',
    institution: 'Masarykova univerzita',
    bio: 'Správce studijního prostoru, který publikuje lekce a řídí přístup.',
    avatarDataUrl: null,
    lastSeenLabel: 'Aktivní před 2 min',
  },
  {
    id: 2,
    name: 'Registrovaný uživatel',
    email: 'reader@example.com',
    role: 'registered',
    institution: 'Fakulta informatiky',
    bio: 'Sleduje sdílené předměty a ukládá si zajímavé lekce.',
    avatarDataUrl: null,
    lastSeenLabel: 'Aktivní dnes',
  },
  {
    id: 3,
    name: 'Návštěvník',
    email: 'public@example.com',
    role: 'public',
    institution: 'Veřejnost',
    bio: 'Prohlíží si jen veřejně sdílené materiály.',
    avatarDataUrl: null,
    lastSeenLabel: 'Bez přihlášení',
  },
]

export const plannerSubjectsSeed: PlannerSubject[] = [
  {
    id: 1,
    name: 'Studijní plánovač',
    teacher: 'Mgr. Novák',
    code: 'PB138',
    files: 6,
    notes: 18,
    ownerId: 1,
    access: 'public',
    description: 'Základní projekt s rolí správce, veřejným náhledem a sdílenými lekcemi.',
    color: 'indigo',
    lessonsCount: 4,
    eventsCount: 3,
    studentsCount: 42,
  },
  {
    id: 2,
    name: 'Databázové systémy',
    teacher: 'Doc. Král',
    code: 'DBS',
    files: 4,
    notes: 12,
    ownerId: 1,
    access: 'registered',
    description: 'Sdílené poznámky, příklady a přednášky pro registrované uživatele.',
    color: 'emerald',
    lessonsCount: 3,
    eventsCount: 2,
    studentsCount: 26,
  },
  {
    id: 3,
    name: 'Algoritmy',
    teacher: 'Ing. Dvořák',
    code: 'ALG',
    files: 3,
    notes: 10,
    ownerId: 1,
    access: 'public',
    description: 'Veřejná ukázka studijního obsahu s omezeným náhledem.',
    color: 'amber',
    lessonsCount: 2,
    eventsCount: 2,
    studentsCount: 18,
  },
  {
    id: 4,
    name: 'Interní mentoring',
    teacher: 'User',
    code: 'INT',
    files: 1,
    notes: 5,
    ownerId: 1,
    access: 'private',
    description: 'Soukromá pracovní plocha pouze pro správce.',
    color: 'rose',
    lessonsCount: 2,
    eventsCount: 1,
    studentsCount: 5,
  },
]

export const plannerLessonsSeed: Lesson[] = [
  {
    id: 1,
    subjectId: 1,
    title: 'Role a oprávnění',
    startsAt: '2026-04-03T09:00:00',
    endsAt: '2026-04-03T10:30:00',
    room: 'A2.12',
    format: 'lecture',
    shared: true,
    notes: 'Student spravuje sdílení, registrovaní vidí publikovanou část.',
  },
  {
    id: 2,
    subjectId: 1,
    title: 'Návrh obrazovek',
    startsAt: '2026-04-05T13:00:00',
    endsAt: '2026-04-05T14:30:00',
    room: 'Studio 3',
    format: 'seminar',
    shared: true,
    notes: 'Cvičení na redesign hlavních stránek.',
  },
  {
    id: 3,
    subjectId: 2,
    title: 'Normalizace dat',
    startsAt: '2026-04-04T11:00:00',
    endsAt: '2026-04-04T12:30:00',
    room: 'B1.08',
    format: 'lecture',
    shared: true,
    notes: 'Pro registrované uživatele.',
  },
  {
    id: 4,
    subjectId: 3,
    title: 'Algoritmická soutěž',
    startsAt: '2026-04-06T15:00:00',
    endsAt: '2026-04-06T16:30:00',
    room: 'Lab C',
    format: 'lab',
    shared: true,
    notes: 'Veřejně sdílený workshop.',
  },
  {
    id: 5,
    subjectId: 4,
    title: 'Interní konzultace',
    startsAt: '2026-04-07T10:00:00',
    endsAt: '2026-04-07T11:00:00',
    room: 'Privátní kanál',
    format: 'seminar',
    shared: false,
    notes: 'Vidí jen student.',
  },
]

export const plannerEventsSeed: Event[] = [
  {
    id: 1,
    subjectId: 1,
    title: 'Odevzdání prototypu',
    startsAt: '2026-04-08T23:59:00',
    endsAt: '2026-04-08T23:59:00',
    kind: 'deadline',
    shared: true,
    location: 'Online odevzdání',
    description: 'Veřejná deadline ukázka projektu.',
  },
  {
    id: 2,
    subjectId: 2,
    title: 'Zkouška databází',
    startsAt: '2026-04-12T09:00:00',
    endsAt: '2026-04-12T10:00:00',
    kind: 'exam',
    shared: true,
    location: 'Aula 1',
    description: 'Zkouška pro registrované studenty.',
  },
  {
    id: 3,
    subjectId: 3,
    title: 'Veřejná konzultace',
    startsAt: '2026-04-10T16:00:00',
    endsAt: '2026-04-10T17:00:00',
    kind: 'consultation',
    shared: true,
    location: 'Online room',
    description: 'Konzultace otevřená veřejnosti.',
  },
  {
    id: 4,
    subjectId: 4,
    title: 'Interní porada týmu',
    startsAt: '2026-04-11T08:30:00',
    endsAt: '2026-04-11T09:15:00',
    kind: 'meeting',
    shared: false,
    location: 'Privátní místnost',
    description: 'Pouze pro správce a tým.',
  },
]

export const plannerScreens: Array<{ id: AppScreen; label: string; description: string }> = [
  { id: 'overview', label: 'Přehled', description: 'Role, souhrn a rychlá orientace.' },
  { id: 'subjects', label: 'Předměty', description: 'Správa a sdílení jednotlivých předmětů.' },
  { id: 'calendar', label: 'Kalendář', description: 'Časová osa lekcí a událostí.' },
  { id: 'users', label: 'Uživatelé', description: 'Kdo co může dělat v systému.' },
]

export const plannerRoleShortcuts: Record<UserRole, string> = {
  student: 'Správce',
  registered: 'Registrovaný',
  public: 'Veřejný',
}

export const plannerLegend: Array<{ label: string; tone: string }> = [
  { label: 'Veřejné', tone: 'public' },
  { label: 'Pro registrované', tone: 'registered' },
  { label: 'Soukromé', tone: 'private' },
]

export const userProfileSeed: UserProfile = {
  fullName: 'User',
  email: 'user@example.com',
  school: 'Masarykova univerzita',
  studyMajor: 'Informatika',
  studyYear: '3. ročník',
  studyType: 'Bakalářské studium',
  avatarDataUrl: null,
}

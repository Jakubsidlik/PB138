export type UserRole = 'student' | 'registered' | 'public'
export interface AuthSession {
  userId: number | string
  role: 'REGISTROVANÝ UŽIVATEL' | 'ADMIN'
  fullName: string
  email: string
}

export interface User {
  id: number
  fullName: string
  email: string
  role: 'REGISTROVANÝ UŽIVATEL' | 'ADMIN'
  school?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
  avatarDataUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  school?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
}

export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: number
  title: string
  done: boolean
  userId?: number
  priority?: TaskPriority
  deletedAt?: string | null
}

export interface CreateTaskRequest {
  title: string
  priority?: TaskPriority
}

export interface UpdateTaskRequest {
  title?: string
  done?: boolean
  priority?: TaskPriority
}

export type EventPriority = 'low' | 'medium' | 'high'

export interface CalendarEvent {
  id: number
  title: string
  date: string
  time?: string | null
  location?: string | null
  isShared?: boolean
  userId?: number
  deletedAt?: string | null
  priority?: EventPriority
}

export interface CreateEventRequest {
  title: string
  date: string
  time?: string | null
  location?: string | null
  priority?: EventPriority
}

export interface UpdateEventRequest {
  title?: string
  date?: string
  time?: string | null
  location?: string | null
  priority?: EventPriority
}

export interface Tag {
  id: number
  name: string
  color: string
  isSystem: boolean
}

export interface Subject {
  id: number
  name: string
  teacher: string
  code: string
  isShared?: boolean
  userId?: number
  studyPlanId?: number | null
  deletedAt?: string | null
  files?: number
  notes?: number
  events?: number
  archived?: boolean
  tags?: Tag[]
}

export interface CreateSubjectRequest {
  name: string
  teacher: string
  code: string
  studyPlanId?: number | null
  tagIds?: number[]
}

export interface UpdateSubjectRequest {
  name?: string
  teacher?: string
  code?: string
  tagIds?: number[]
}

export interface StudyPlan {
  id: number
  userId: number
  name: string
  description?: string
  isActive?: boolean
  isShared?: boolean
  createdAt?: string
  updatedAt?: string
  subjectsCount?: number
  tasksCount?: number
  lessonsCount?: number
}

export interface CreateStudyPlanRequest {
  name: string
  description?: string
}

export interface UpdateStudyPlanRequest {
  name?: string
  description?: string
  isActive?: boolean
}

export interface FileRecord {
  id: number
  name: string
  size: string
  sizeBytes: number
  category: 'pdf' | 'image' | 'document' | 'folder' | 'other'
  addedLabel: string
  isShared?: boolean
  userId?: number
  subjectId?: number | null
  deletedAt?: string | null
  likes?: number
  dislikes?: number
  userVote?: 'LIKE' | 'DISLIKE' | null
  userEmail?: string
  fileUrl?: string
  fileKey?: string
}

export interface ManagedFile extends FileRecord {
  shared?: boolean
}

export interface CreateFileRequest {
  name: string
  addedLabel: string
  subjectId?: number | null
}

export interface UpdateFileRequest {
  name?: string
  addedLabel?: string
}

export interface Lesson {
  id: number
  title: string
  content?: string | null
  isShared?: boolean
  orderIndex: number
  subjectId?: number | null
  authorId?: number | null
  authorFullName?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  notesCount?: number
  filesCount?: number
  likes?: number
  dislikes?: number
  userVote?: 'LIKE' | 'DISLIKE' | null
  userEmail?: string
}

export interface CreateLessonRequest {
  title: string
  content?: string | null
  subjectId?: number | null
}

export interface UpdateLessonRequest {
  title?: string
  content?: string | null
  orderIndex?: number
}

export type CollaborationRole = 'VIEWER' | 'CONTRIBUTOR'

export interface StudyPlanCollaborator {
  id: number
  studyPlanId: number
  userId: number
  role: CollaborationRole
  user?: User
  createdAt?: string
  updatedAt?: string
}

export interface ShareStudyPlanRequest {
  email: string
  role: CollaborationRole
}

export interface PaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  nextCursor?: string | null
}

export interface ApiError {
  error: string
}

export type FileCategory = 'folder' | 'pdf' | 'image' | 'document' | 'other'
export type FileTab = 'all' | 'recent' | 'shared'

export type FileFolder = {
  id: number
  name: string
  filesCount: number
  color: 'amber' | 'emerald' | 'primary' | 'slate'
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
	| 'rose'
	| 'amber'
	| 'mono'
export type MobileNavItem = 'home' | 'calendar' | 'tasks' | 'files' | 'study-plan' | 'profile'

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
  tone: 'blue' | 'green' | 'violet' | 'orange' | 'emerald'
}

export type DesktopSubjectTone = 'blue' | 'green' | 'violet' | 'orange' | 'cyan' | 'emerald'

export type DesktopSubjectMeta = {
  icon: string
  tone: DesktopSubjectTone
}


export type PlannerCalendarKind = 'lesson' | 'event'

export type PlannerCalendarColor = 'blue' | 'green' | 'violet' | 'orange' | 'cyan' | 'pink'

export type PlannerCalendarItem = {
  id: number
  title: string
  subjectCode: string
  subjectTitle: string
  start: Date
  end: Date
  kind: PlannerCalendarKind
  color: PlannerCalendarColor
  shared: boolean
  location: string
  description: string
}

export type CalendarCell = {
  date: Date
  iso: string
  inCurrentMonth: boolean
}

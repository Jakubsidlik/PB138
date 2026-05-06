// Auth & User types
export type UserRole = 'student' | 'registered' | 'public'
export interface AuthSession {
  userId: number | string
  role: 'REGISTERED' | 'ADMIN'
  fullName: string
  email: string
}

export interface User {
  id: number
  fullName: string
  email: string
  role: 'REGISTERED' | 'ADMIN'
  school?: string
  faculty?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
  birthDate?: string | null
  bio?: string | null
  avatarDataUrl?: string | null
  contactEmail?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  school?: string
  faculty?: string
  studyMajor?: string
  studyYear?: string
  studyType?: string
  birthDate?: string
  bio?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
}

// Task types
export interface Task {
  id: number
  title: string
  done: boolean
  subjectId?: number | null
  userId?: number
  studyPlanId?: number | null
  favorite?: boolean
  tag?: string | null
  deadline?: string | null
  deletedAt?: string | null
}

export interface CreateTaskRequest {
  title: string
  subjectId?: number | null
  studyPlanId?: number | null
  deadline?: string | null
}

export interface UpdateTaskRequest {
  title?: string
  done?: boolean
  favorite?: boolean
  tag?: string | null
  deadline?: string | null
  subjectId?: number | null
}

// Event types
export type EventRecurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type EventPriority = 'low' | 'medium' | 'high'

export interface CalendarEvent {
  id: number
  title: string
  date: string
  time?: string | null
  location?: string | null
  subjectId?: number | null
  isShared?: boolean
  recurrence?: EventRecurrence
  recurrenceGroupId?: string | null
  userId?: number
  deletedAt?: string | null
  priority?: EventPriority
}

export interface CreateEventRequest {
  title: string
  date: string
  time?: string | null
  location?: string | null
  subjectId?: number | null
  recurrence?: EventRecurrence
  priority?: EventPriority
}

export interface UpdateEventRequest {
  title?: string
  date?: string
  time?: string | null
  location?: string | null
  recurrence?: EventRecurrence
  subjectId?: number | null
  priority?: EventPriority
}

// Subject types
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
}

export interface CreateSubjectRequest {
  name: string
  teacher: string
  code: string
  studyPlanId?: number | null
}

export interface UpdateSubjectRequest {
  name?: string
  teacher?: string
  code?: string
}

// StudyPlan types
export interface StudyPlan {
  id: number
  userId: number
  name: string
  description?: string
  faculty?: string
  startDate?: string | null
  endDate?: string | null
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
  faculty?: string
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateStudyPlanRequest {
  name?: string
  description?: string
  isActive?: boolean
}

// File types
export interface FileRecord {
  id: number
  name: string
  size: string
  sizeBytes: number
  category: 'pdf' | 'image' | 'document' | 'other' | 'folder'
  addedLabel: string
  isShared?: boolean
  userId?: number
  subjectId?: number | null
  lessonId?: number | null
  deletedAt?: string | null
}

export interface ManagedFile extends FileRecord {
  shared?: boolean
}

export interface CreateFileRequest {
  name: string
  addedLabel: string
  subjectId?: number | null
  lessonId?: number | null
}

export interface UpdateFileRequest {
  name?: string
  addedLabel?: string
}

// File Comment types
export interface FileComment {
  id: number
  fileId: number
  userId: number
  comment: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateFileCommentRequest {
  comment: string
}

export interface UpdateFileCommentRequest {
  comment: string
}

// Lesson types
export interface Lesson {
  id: number
  title: string
  content?: string | null
  isShared?: boolean
  orderIndex: number
  subjectId?: number | null
  studyPlanId?: number | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  notesCount?: number
  filesCount?: number
}

export interface CreateLessonRequest {
  title: string
  content?: string | null
  subjectId?: number | null
  studyPlanId?: number | null
}

export interface UpdateLessonRequest {
  title?: string
  content?: string | null
  orderIndex?: number
}

// Lesson Note types
export interface LessonNote {
  id: number
  lessonId: number
  userId: number
  note: string
  isPinned?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateLessonNoteRequest {
  note: string
  isPinned?: boolean
}

export interface UpdateLessonNoteRequest {
  note?: string
  isPinned?: boolean
}

// Annotation types
export type AnnotationTargetType = 'LESSON' | 'LESSON_NOTE' | 'FILE_COMMENT'

export interface TextAnnotation {
  id: number
  targetType: AnnotationTargetType
  targetId: number
  userId: number
  startOffset: number
  endOffset: number
  selectedText: string
  comment: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateAnnotationRequest {
  targetType: AnnotationTargetType
  targetId: number
  startOffset: number
  endOffset: number
  selectedText: string
  comment: string
}

// Collaboration types
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

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  nextCursor?: string | null
}

// Error response
export interface ApiError {
  error: string
}

// UI/UX types (kept from original)
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
  faculty: string
  studyMajor: string
  studyYear: string
  studyType: string
  birthDate: string | null
  bio: string | null
  avatarDataUrl: string | null
  contactEmail: string | null
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


export type PlannerCalendarKind = 'lesson' | 'event'

export type PlannerCalendarColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose'

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

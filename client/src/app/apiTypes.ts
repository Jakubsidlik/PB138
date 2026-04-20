// Auth & User types
export interface AuthSession {
  userId: number
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
}

export interface CreateEventRequest {
  title: string
  date: string
  time?: string | null
  location?: string | null
  subjectId?: number | null
  recurrence?: EventRecurrence
}

export interface UpdateEventRequest {
  title?: string
  date?: string
  time?: string | null
  location?: string | null
  recurrence?: EventRecurrence
  subjectId?: number | null
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

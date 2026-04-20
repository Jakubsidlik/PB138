import type {
  ApiError,
  AuthResponse,
  CalendarEvent,
  CreateAnnotationRequest,
  CreateEventRequest,
  CreateFileCommentRequest,
  CreateFileRequest,
  CreateLessonNoteRequest,
  CreateLessonRequest,
  CreateStudyPlanRequest,
  CreateSubjectRequest,
  CreateTaskRequest,
  FileComment,
  FileRecord,
  Lesson,
  LessonNote,
  LoginRequest,
  PaginatedResponse,
  RegisterRequest,
  ShareStudyPlanRequest,
  StudyPlan,
  StudyPlanCollaborator,
  Subject,
  Task,
  TextAnnotation,
  UpdateEventRequest,
  UpdateFileCommentRequest,
  UpdateFileRequest,
  UpdateLessonNoteRequest,
  UpdateLessonRequest,
  UpdateStudyPlanRequest,
  UpdateSubjectRequest,
  UpdateTaskRequest,
  User,
} from './apiTypes'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
  private userId: number | null = null

  setUserId(userId: number | null) {
    this.userId = userId
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${API_BASE_URL}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.userId !== null) {
      headers['x-user-id'] = String(this.userId)
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = 'API Error'
      try {
        const errorData = (await response.json()) as ApiError
        errorMessage = errorData.error || errorMessage
      } catch {
        // Continue with default error message
      }
      throw new Error(errorMessage)
    }

    const data = (await response.json()) as T
    return data
  }

  // Health check
  async health() {
    return this.request('GET', '/api/health')
  }

  // Auth endpoints
  async register(payload: RegisterRequest) {
    const response = await this.request<AuthResponse>('POST', '/api/auth/register', payload)
    return response
  }

  async login(payload: LoginRequest) {
    const response = await this.request<AuthResponse>('POST', '/api/auth/login', payload)
    return response
  }

  // User endpoints
  async getUsers() {
    return this.request<User[]>('GET', '/api/users')
  }

  async getProfile() {
    return this.request<User>('GET', '/api/profile')
  }

  async updateProfile(payload: Partial<User>) {
    return this.request<User>('PUT', '/api/profile', payload)
  }

  async uploadAvatar(avatarDataUrl: string) {
    return this.request<User>('POST', '/api/profile', { avatarDataUrl })
  }

  async deleteProfile() {
    return this.request('DELETE', '/api/profile')
  }

  // StudyPlan endpoints
  async getStudyPlans() {
    return this.request<PaginatedResponse<StudyPlan>>('GET', '/api/study-plans?paginated=true')
  }

  async getStudyPlansPaginated(cursor?: string) {
    const query = cursor ? `?paginated=true&cursor=${cursor}` : '?paginated=true'
    return this.request<PaginatedResponse<StudyPlan>>('GET', `/api/study-plans${query}`)
  }

  async createStudyPlan(payload: CreateStudyPlanRequest) {
    return this.request<StudyPlan>('POST', '/api/study-plans', payload)
  }

  async updateStudyPlan(id: number, payload: UpdateStudyPlanRequest) {
    return this.request<StudyPlan>('PATCH', `/api/study-plans/${id}`, payload)
  }

  async deleteStudyPlan(id: number) {
    return this.request('DELETE', `/api/study-plans/${id}`)
  }

  async getStudyPlanCollaborators(id: number) {
    return this.request<StudyPlanCollaborator[]>('GET', `/api/study-plans/${id}/collaborators`)
  }

  async shareStudyPlan(id: number, payload: ShareStudyPlanRequest) {
    return this.request<StudyPlanCollaborator>('POST', `/api/study-plans/${id}/share`, payload)
  }

  async removeStudyPlanCollaborator(id: number, userId: number) {
    return this.request('DELETE', `/api/study-plans/${id}/share/${userId}`)
  }

  // Subject endpoints
  async getSubjects(studyPlanId?: number | null) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '?paginated=true'
    return this.request<PaginatedResponse<Subject>>('GET', `/api/subjects${query}`)
  }

  async createSubject(payload: CreateSubjectRequest) {
    return this.request<Subject>('POST', '/api/subjects', payload)
  }

  async updateSubject(id: number, payload: UpdateSubjectRequest) {
    return this.request<Subject>('PUT', `/api/subjects/${id}`, payload)
  }

  async deleteSubject(id: number) {
    return this.request('DELETE', `/api/subjects/${id}`)
  }

  // Task endpoints
  async getTasks(studyPlanId?: number | null) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '?paginated=true'
    return this.request<PaginatedResponse<Task>>('GET', `/api/tasks${query}`)
  }

  async createTask(payload: CreateTaskRequest) {
    return this.request<Task>('POST', '/api/tasks', payload)
  }

  async updateTask(id: number, payload: UpdateTaskRequest) {
    return this.request<Task>('PATCH', `/api/tasks/${id}`, payload)
  }

  async archiveTask(id: number) {
    return this.request<Task>('POST', `/api/tasks/${id}/archive`)
  }

  async deleteTask(id: number) {
    return this.request('DELETE', `/api/tasks/${id}`)
  }

  async updateTasksBatch(tasks: Task[]) {
    return this.request<Task[]>('PUT', '/api/tasks', tasks)
  }

  async getTaskArchive() {
    return this.request<PaginatedResponse<Task>>('GET', '/api/task-archive?paginated=true')
  }

  // Event endpoints
  async getEvents(studyPlanId?: number | null) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '?paginated=true'
    return this.request<PaginatedResponse<CalendarEvent>>('GET', `/api/events${query}`)
  }

  async createEvent(payload: CreateEventRequest) {
    return this.request<CalendarEvent>('POST', '/api/events', payload)
  }

  async updateEvent(id: number, payload: UpdateEventRequest) {
    return this.request<CalendarEvent>('PATCH', `/api/events/${id}`, payload)
  }

  async deleteEvent(id: number) {
    return this.request('DELETE', `/api/events/${id}`)
  }

  async updateEventsBatch(events: CalendarEvent[]) {
    return this.request<CalendarEvent[]>('PUT', '/api/events', events)
  }

  // File endpoints
  async getFiles(studyPlanId?: number | null) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '?paginated=true'
    return this.request<PaginatedResponse<FileRecord>>('GET', `/api/files${query}`)
  }

  async getPublicFiles() {
    return this.request<PaginatedResponse<FileRecord>>('GET', '/api/files/public?paginated=true')
  }

  async getAdminFiles() {
    return this.request<PaginatedResponse<FileRecord>>('GET', '/api/admin/files?paginated=true')
  }

  async createFile(payload: CreateFileRequest) {
    return this.request<FileRecord>('POST', '/api/files', payload)
  }

  async updateFile(id: number, payload: UpdateFileRequest) {
    return this.request<FileRecord>('PUT', `/api/files/${id}`, payload)
  }

  async deleteFile(id: number) {
    return this.request('DELETE', `/api/files/${id}`)
  }

  async approveFile(id: number) {
    return this.request<FileRecord>('PATCH', `/api/admin/files/${id}/moderation`, {
      status: 'APPROVED',
    })
  }

  async rejectFile(id: number, reason?: string) {
    return this.request<FileRecord>('PATCH', `/api/admin/files/${id}/moderation`, {
      status: 'REJECTED',
      reason,
    })
  }

  // File Comment endpoints
  async getFileComments(fileId: number) {
    return this.request<PaginatedResponse<FileComment>>('GET', `/api/files/${fileId}/comments?paginated=true`)
  }

  async createFileComment(fileId: number, payload: CreateFileCommentRequest) {
    return this.request<FileComment>('POST', `/api/files/${fileId}/comments`, payload)
  }

  async updateFileComment(commentId: number, payload: UpdateFileCommentRequest) {
    return this.request<FileComment>('PATCH', `/api/file-comments/${commentId}`, payload)
  }

  async deleteFileComment(commentId: number) {
    return this.request('DELETE', `/api/file-comments/${commentId}`)
  }

  // Lesson endpoints
  async getLessons(studyPlanId?: number | null) {
    const query = studyPlanId ? `?studyPlanId=${studyPlanId}` : '?paginated=true'
    return this.request<PaginatedResponse<Lesson>>('GET', `/api/lessons${query}`)
  }

  async createLesson(payload: CreateLessonRequest) {
    return this.request<Lesson>('POST', '/api/lessons', payload)
  }

  async updateLesson(id: number, payload: UpdateLessonRequest) {
    return this.request<Lesson>('PATCH', `/api/lessons/${id}`, payload)
  }

  async deleteLesson(id: number) {
    return this.request('DELETE', `/api/lessons/${id}`)
  }

  // Lesson Note endpoints
  async getLessonNotes(lessonId: number) {
    return this.request<PaginatedResponse<LessonNote>>('GET', `/api/lessons/${lessonId}/notes?paginated=true`)
  }

  async createLessonNote(lessonId: number, payload: CreateLessonNoteRequest) {
    return this.request<LessonNote>('POST', `/api/lessons/${lessonId}/notes`, payload)
  }

  async updateLessonNote(noteId: number, payload: UpdateLessonNoteRequest) {
    return this.request<LessonNote>('PATCH', `/api/lesson-notes/${noteId}`, payload)
  }

  async deleteLessonNote(noteId: number) {
    return this.request('DELETE', `/api/lesson-notes/${noteId}`)
  }

  // Annotation endpoints
  async getAnnotations(targetId: number) {
    return this.request<PaginatedResponse<TextAnnotation>>('GET', `/api/annotations?targetId=${targetId}&paginated=true`)
  }

  async createAnnotation(payload: CreateAnnotationRequest) {
    return this.request<TextAnnotation>('POST', '/api/annotations', payload)
  }

  async deleteAnnotation(annotationId: number) {
    return this.request('DELETE', `/api/annotations/${annotationId}`)
  }
}

export const apiClient = new ApiClient()

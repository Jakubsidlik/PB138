/**
 * Generated from openapi.yaml
 * Do not edit manually
 */

export interface Subject {
  id: number
  userId: number
  studyPlanId: number | null
  name: string
  teacher: string
  code: string
  isShared: boolean
  archived: boolean
  files: number
  tasks: number
  events: number
  notes: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateSubjectRequest {
  name: string
  teacher: string
  code: string
  studyPlanId?: number | null
  isShared?: boolean
}

export interface UpdateSubjectRequest {
  name?: string
  teacher?: string
  code?: string
  studyPlanId?: number | null
  isShared?: boolean
  archived?: boolean
}

export interface PaginatedSubjects {
  data: Subject[]
  hasMore: boolean
  nextCursor: string | null
  limit: number
}

export interface SuccessResponse {
  success: boolean
}

export interface ErrorResponse {
  error: string
}

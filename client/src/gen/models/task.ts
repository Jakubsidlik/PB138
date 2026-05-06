/**
 * Generated from openapi.yaml
 * Do not edit manually
 */

export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: number
  userId: number
  title: string
  done: boolean
  subjectId: number | null
  studyPlanId: number | null
  favorite: boolean
  tag: string | null
  deadline: string | null
  deletedAt: string | null
}

export interface CreateTaskRequest {
  title: string
  done?: boolean
  subjectId?: number | null
  studyPlanId?: number | null
  favorite?: boolean
  tag?: string | null
  priority?: TaskPriority
  deadline?: string | null
}

export interface UpdateTaskRequest {
  title?: string
  done?: boolean
  subjectId?: number | null
  studyPlanId?: number | null
  favorite?: boolean
  tag?: string | null
  priority?: TaskPriority
  deadline?: string | null
}

export interface BulkTaskItem {
  id: number
  title: string
  done: boolean
  subjectId?: number | null
}

export interface BulkTaskRequest {
  tasks: BulkTaskItem[]
}

export interface BulkTasksResponse {
  success: boolean
  tasks?: Task[]
}

export interface PaginatedTasks {
  data: Task[]
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

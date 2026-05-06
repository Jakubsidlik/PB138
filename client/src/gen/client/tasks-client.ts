/**
 * Generated from openapi.yaml - Axios client for Tasks
 * Do not edit manually
 */

import axios, { AxiosInstance } from 'axios'
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  BulkTaskRequest,
  BulkTasksResponse,
  PaginatedTasks,
  SuccessResponse,
  ErrorResponse,
} from '../models'

interface ListTasksParams {
  limit?: number
  cursor?: string
  paginated?: boolean
  subjectId?: number
  studyPlanId?: number
  done?: boolean
  favorite?: boolean
  tag?: string
  search?: string
  deadlineFrom?: string
  deadlineTo?: string
  includeDeleted?: boolean
}

export class TasksClient {
  constructor(private client: AxiosInstance) {}

  /**
   * GET /api/tasks
   * List tasks with optional filtering and pagination
   */
  async list(params?: ListTasksParams): Promise<Task[] | PaginatedTasks> {
    const { data } = await this.client.get<Task[] | PaginatedTasks>('/api/tasks', { params })
    return data
  }

  /**
   * POST /api/tasks
   * Create a new task
   */
  async create(payload: CreateTaskRequest): Promise<Task> {
    const { data } = await this.client.post<Task>('/api/tasks', payload)
    return data
  }

  /**
   * PATCH /api/tasks/:id
   * Update a task
   */
  async update(id: number, payload: UpdateTaskRequest): Promise<Task> {
    const { data } = await this.client.patch<Task>(`/api/tasks/${id}`, payload)
    return data
  }

  /**
   * DELETE /api/tasks/:id
   * Delete a task (soft delete)
   */
  async delete(id: number): Promise<SuccessResponse> {
    const { data } = await this.client.delete<SuccessResponse>(`/api/tasks/${id}`)
    return data
  }

  /**
   * PUT /api/tasks
   * Bulk update/upsert tasks
   */
  async bulkUpdate(payload: BulkTaskRequest): Promise<BulkTasksResponse> {
    const { data } = await this.client.put<BulkTasksResponse>('/api/tasks', payload)
    return data
  }
}

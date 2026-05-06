/**
 * Generated from openapi.yaml - Axios client for Subjects
 * Do not edit manually
 */

import axios, { AxiosInstance } from 'axios'
import type {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  PaginatedSubjects,
  SuccessResponse,
  ErrorResponse,
} from '../models'

interface ListSubjectsParams {
  limit?: number
  cursor?: string
  paginated?: boolean
  studyPlanId?: number
  includeDeleted?: boolean
}

export class SubjectsClient {
  constructor(private client: AxiosInstance) {}

  /**
   * GET /api/subjects
   * List subjects with optional filtering and pagination
   */
  async list(params?: ListSubjectsParams): Promise<Subject[] | PaginatedSubjects> {
    const { data } = await this.client.get<Subject[] | PaginatedSubjects>('/api/subjects', { params })
    return data
  }

  /**
   * POST /api/subjects
   * Create a new subject
   */
  async create(payload: CreateSubjectRequest): Promise<Subject> {
    const { data } = await this.client.post<Subject>('/api/subjects', payload)
    return data
  }

  /**
   * PUT /api/subjects/:id
   * Update a subject
   */
  async update(id: number, payload: UpdateSubjectRequest): Promise<Subject> {
    const { data } = await this.client.put<Subject>(`/api/subjects/${id}`, payload)
    return data
  }

  /**
   * DELETE /api/subjects/:id
   * Delete a subject (soft delete with cascade)
   */
  async delete(id: number): Promise<SuccessResponse> {
    const { data } = await this.client.delete<SuccessResponse>(`/api/subjects/${id}`)
    return data
  }
}

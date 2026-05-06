/**
 * API Client - Generated from OpenAPI specification
 *
 * This file provides a singleton instance of the API clients.
 * The actual implementation is generated from openapi.yaml using Kubb.
 *
 * Direct imports from generated code:
 * import { createApiClients, TasksClient, SubjectsClient } from '../gen'
 */

import { createApiClients } from '../gen'

// Create singleton instance
export const apiClients = createApiClients()

// Backward compatibility wrapper
export const apiClient = {
  get axios() {
    return apiClients.axios
  },
  get tasks() {
    return apiClients.tasks
  },
  get subjects() {
    return apiClients.subjects
  },
}

// Re-export all generated types
export * from '../gen/models'
export * from '../gen'

/**
 * Legacy types import
 * For backward compatibility with existing code
 */
export type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
} from '../gen/models'


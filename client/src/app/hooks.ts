/**
 * React Query Hooks - Generated from OpenAPI specification
 *
 * This file provides React Query hooks for data fetching and mutations.
 * The actual hooks are generated from openapi.yaml using Kubb.
 *
 * Direct imports from generated code:
 * import { useTasks, useCreateTask, useUpdateTask, etc. } from '../gen/hooks'
 */

import { apiClients } from './api'

// Re-export all generated hooks
export * from '../gen/hooks'

// Convenience hooks that use the singleton apiClients instance
import {
  useTasks as _useTasks,
  useTasksInfinite as _useTasksInfinite,
  useCreateTask as _useCreateTask,
  useUpdateTask as _useUpdateTask,
  useDeleteTask as _useDeleteTask,
  useBulkUpdateTasks as _useBulkUpdateTasks,
  useSubjects as _useSubjects,
  useSubjectsInfinite as _useSubjectsInfinite,
  useCreateSubject as _useCreateSubject,
  useUpdateSubject as _useUpdateSubject,
  useDeleteSubject as _useDeleteSubject,
} from '../gen/hooks'

// Convenience wrappers - pass apiClients automatically
/**
 * Fetch tasks with filters and optional pagination
 */
export function useTasks(params?: any) {
  return _useTasks(apiClients.tasks, params)
}

/**
 * Fetch tasks with infinite pagination (for scroll loading)
 */
export function useTasksInfinite(params?: any) {
  return _useTasksInfinite(apiClients.tasks, params)
}

/**
 * Create a new task
 */
export function useCreateTask() {
  return _useCreateTask(apiClients.tasks)
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  return _useUpdateTask(apiClients.tasks)
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  return _useDeleteTask(apiClients.tasks)
}

/**
 * Bulk update/upsert multiple tasks
 */
export function useBulkUpdateTasks() {
  return _useBulkUpdateTasks(apiClients.tasks)
}

/**
 * Fetch subjects with filters and optional pagination
 */
export function useSubjects(params?: any) {
  return _useSubjects(apiClients.subjects, params)
}

/**
 * Fetch subjects with infinite pagination
 */
export function useSubjectsInfinite(params?: any) {
  return _useSubjectsInfinite(apiClients.subjects, params)
}

/**
 * Create a new subject
 */
export function useCreateSubject() {
  return _useCreateSubject(apiClients.subjects)
}

/**
 * Update an existing subject
 */
export function useUpdateSubject() {
  return _useUpdateSubject(apiClients.subjects)
}

/**
 * Delete a subject
 */
export function useDeleteSubject() {
  return _useDeleteSubject(apiClients.subjects)
}

export function useFileComments(fileId: number) {
  return usePaginatedQuery(() => apiClient.getFileComments(fileId), [fileId])
}

export function useAnnotations(targetId: number) {
  return usePaginatedQuery(() => apiClient.getAnnotations(targetId), [targetId])
}

export function useUsers() {
  return useQuery(() => apiClient.getUsers())
}

/**
 * API Hooks Wrapper
 * Provides custom hooks that wrap generated hooks with API client
 * Handles query invalidation and mutation callbacks
 */

import { useCallback } from 'react'
import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { apiClients } from './api'
import { queryClient, queryKeys } from './queries'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../gen/models'
import type { Subject, CreateSubjectRequest, UpdateSubjectRequest } from '../gen/models'

/**
 * Setup Axios interceptor with Clerk auth token
 */
export function useSetupApiAuth() {
  const { getToken } = useAuth()

  return useCallback(async () => {
    // Add interceptor to include auth token in all requests
    apiClients.axios.interceptors.request.use(
      async (config: any) => {
        try {
          const token = await getToken()
          if (token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch {
          // Token not available, continue without auth
        }
        return config
      },
      (error: any) => Promise.reject(error),
    )
  }, [getToken])
}

// ============================================================================
// TASKS HOOKS
// ============================================================================

/**
 * Fetch tasks from API
 */
export function useTasks(): UseQueryResult<Task[]> {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      // Ensure we always return an array
      return Array.isArray(result) ? result : []
    },
  })
}

/**
 * Fetch single task by ID
 */
export function useTask(id: number) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: async () => {
      const tasks = await apiClients.tasks.list()
      const taskList = Array.isArray(tasks) ? tasks : []
      const task = taskList.find((t) => t.id === id)
      if (!task) throw new Error(`Task ${id} not found`)
      return task
    },
    enabled: id > 0,
  })
}

/**
 * Create a new task
 */
export function useCreateTask(): UseMutationResult<Task, Error, CreateTaskRequest> {
  return useMutation({
    mutationFn: (payload) => apiClients.tasks.create(payload),
    onSuccess: () => {
      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

/**
 * Update a task
 */
export function useUpdateTask(): UseMutationResult<Task, Error, { id: number; payload: UpdateTaskRequest }> {
  return useMutation({
    mutationFn: ({ id, payload }) => apiClients.tasks.update(id, payload),
    onSuccess: (data) => {
      // Invalidate both list and specific task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(data.id) })
    },
  })
}

/**
 * Delete a task
 */
export function useDeleteTask(): UseMutationResult<{ success: boolean }, Error, number> {
  return useMutation({
    mutationFn: (id) => apiClients.tasks.delete(id),
    onSuccess: () => {
      // Invalidate tasks list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

/**
 * Toggle task completion status
 * Note: Requires fetching task data to get current status
 * For better performance, pass current done status directly in components
 */
export function useToggleTask(): UseMutationResult<Task, Error, number> {
  return useMutation({
    mutationFn: async (id) => {
      const tasks = await apiClients.tasks.list()
      const taskList = Array.isArray(tasks) ? tasks : []
      const task = taskList.find((t) => t.id === id)
      if (!task) throw new Error(`Task ${id} not found`)

      return apiClients.tasks.update(id, { done: !task.done } as UpdateTaskRequest)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(data.id) })
    },
  })
}

// ============================================================================
// SUBJECTS HOOKS
// ============================================================================

/**
 * Fetch subjects from API
 */
export function useSubjects(): UseQueryResult<Subject[]> {
  return useQuery({
    queryKey: queryKeys.subjects || ['app', 'subjects'],
    queryFn: async () => {
      const result = await apiClients.subjects.list()
      // Ensure we always return an array
      return Array.isArray(result) ? result : []
    },
  })
}

/**
 * Create a new subject
 */
export function useCreateSubject(): UseMutationResult<Subject, Error, CreateSubjectRequest> {
  return useMutation({
    mutationFn: (payload) => apiClients.subjects.create(payload),
    onSuccess: () => {
      // Invalidate subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects || ['app', 'subjects'] })
    },
  })
}

/**
 * Update a subject
 */
export function useUpdateSubject(): UseMutationResult<Subject, Error, { id: number; payload: UpdateSubjectRequest }> {
  return useMutation({
    mutationFn: ({ id, payload }) => apiClients.subjects.update(id, payload),
    onSuccess: () => {
      // Invalidate subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects || ['app', 'subjects'] })
    },
  })
}

/**
 * Delete a subject
 */
export function useDeleteSubject(): UseMutationResult<{ success: boolean }, Error, number> {
  return useMutation({
    mutationFn: (id) => apiClients.subjects.delete(id),
    onSuccess: () => {
      // Invalidate subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects || ['app', 'subjects'] })
    },
  })
}

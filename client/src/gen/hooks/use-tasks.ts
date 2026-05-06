/**
 * Generated from openapi.yaml - TanStack Query hooks for Tasks
 * Do not edit manually
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  UseQueryResult,
  UseMutationResult,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { TasksClient } from '../client/tasks-client'
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  BulkTaskRequest,
  BulkTasksResponse,
  PaginatedTasks,
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

/**
 * Hook for fetching tasks with filters
 */
export function useTasks(
  client: TasksClient,
  params?: ListTasksParams,
): UseQueryResult<Task[] | PaginatedTasks> {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => client.list(params),
  })
}

/**
 * Hook for paginated task fetching with infinite scroll
 */
export function useTasksInfinite(
  client: TasksClient,
  params?: Omit<ListTasksParams, 'cursor'>,
): UseInfiniteQueryResult<PaginatedTasks> {
  return useInfiniteQuery({
    queryKey: ['tasks-infinite', params],
    queryFn: ({ pageParam }) => client.list({ ...params, cursor: pageParam }) as Promise<PaginatedTasks>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
  })
}

/**
 * Hook for creating a task
 */
export function useCreateTask(
  client: TasksClient,
): UseMutationResult<Task, Error, CreateTaskRequest> {
  return useMutation({
    mutationFn: (payload) => client.create(payload),
  })
}

/**
 * Hook for updating a task
 */
export function useUpdateTask(
  client: TasksClient,
): UseMutationResult<Task, Error, { id: number; payload: UpdateTaskRequest }> {
  return useMutation({
    mutationFn: ({ id, payload }) => client.update(id, payload),
  })
}

/**
 * Hook for deleting a task
 */
export function useDeleteTask(
  client: TasksClient,
): UseMutationResult<{ success: boolean }, Error, number> {
  return useMutation({
    mutationFn: (id) => client.delete(id),
  })
}

/**
 * Hook for bulk updating tasks
 */
export function useBulkUpdateTasks(
  client: TasksClient,
): UseMutationResult<BulkTasksResponse, Error, BulkTaskRequest> {
  return useMutation({
    mutationFn: (payload) => client.bulkUpdate(payload),
  })
}

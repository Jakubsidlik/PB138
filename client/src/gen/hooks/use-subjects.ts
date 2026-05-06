/**
 * Generated from openapi.yaml - TanStack Query hooks for Subjects
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
import type { SubjectsClient } from '../client/subjects-client'
import type {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  PaginatedSubjects,
} from '../models'

interface ListSubjectsParams {
  limit?: number
  cursor?: string
  paginated?: boolean
  studyPlanId?: number
  includeDeleted?: boolean
}

/**
 * Hook for fetching subjects with filters
 */
export function useSubjects(
  client: SubjectsClient,
  params?: ListSubjectsParams,
): UseQueryResult<Subject[] | PaginatedSubjects> {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => client.list(params),
  })
}

/**
 * Hook for paginated subject fetching with infinite scroll
 */
export function useSubjectsInfinite(
  client: SubjectsClient,
  params?: Omit<ListSubjectsParams, 'cursor'>,
): UseInfiniteQueryResult<PaginatedSubjects> {
  return useInfiniteQuery({
    queryKey: ['subjects-infinite', params],
    queryFn: ({ pageParam }) => client.list({ ...params, cursor: pageParam }) as Promise<PaginatedSubjects>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
  })
}

/**
 * Hook for creating a subject
 */
export function useCreateSubject(
  client: SubjectsClient,
): UseMutationResult<Subject, Error, CreateSubjectRequest> {
  return useMutation({
    mutationFn: (payload) => client.create(payload),
  })
}

/**
 * Hook for updating a subject
 */
export function useUpdateSubject(
  client: SubjectsClient,
): UseMutationResult<Subject, Error, { id: number; payload: UpdateSubjectRequest }> {
  return useMutation({
    mutationFn: ({ id, payload }) => client.update(id, payload),
  })
}

/**
 * Hook for deleting a subject
 */
export function useDeleteSubject(
  client: SubjectsClient,
): UseMutationResult<{ success: boolean }, Error, number> {
  return useMutation({
    mutationFn: (id) => client.delete(id),
  })
}

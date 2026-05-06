import React from 'react'
import { apiClient } from './api'
import type {
  CalendarEvent,
  CreateEventRequest,
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  UpdateEventRequest,
  UpdateTaskRequest,
} from './types'

interface UseQueryState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UsePaginatedState<T> {
  data: T[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  nextCursor?: string | null
}

/**
 * Generic hook for fetching data
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = [],
): UseQueryState<T> {
  const [state, setState] = React.useState<UseQueryState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  React.useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const data = await fetcher()
        if (isMounted) {
          setState({ data, loading: false, error: null })
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, dependencies)

  return state
}

/**
 * Hook for paginated data fetching
 */
export function usePaginatedQuery<T>(
  fetcher: (cursor?: string) => Promise<PaginatedResponse<T>>,
  dependencies: React.DependencyList = [],
): UsePaginatedState<T> & {
  loadMore: () => Promise<void>
} {
  const [state, setState] = React.useState<UsePaginatedState<T>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
  })

  React.useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await fetcher()
        if (isMounted) {
          setState({
            data: response.data,
            loading: false,
            error: null,
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
          })
        }
      } catch (error) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }))
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, dependencies)

  const loadMore = React.useCallback(async () => {
    if (!state.hasMore || state.loading) return

    try {
      const response = await fetcher(state.nextCursor || undefined)
      setState((prev) => ({
        ...prev,
        data: [...prev.data, ...response.data],
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    }
  }, [state.hasMore, state.loading, state.nextCursor])

  return { ...state, loadMore }
}

/**
 * Hook for mutation operations (create/update/delete)
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const [state, setState] = React.useState({
    data: null as TData | null,
    loading: false,
    error: null as Error | null,
  })

  const mutate = React.useCallback(async (variables: TVariables) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await mutationFn(variables)
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState({ data: null, loading: false, error: err })
      throw err
    }
  }, [mutationFn])

  return { ...state, mutate }
}

// Specific hooks

export function useProfile() {
  return useQuery(() => apiClient.getProfile())
}

export function useStudyPlans() {
  return usePaginatedQuery(() => apiClient.getStudyPlans())
}

export function useSubjects(studyPlanId?: number | null) {
  return usePaginatedQuery(() => apiClient.getSubjects(studyPlanId), [studyPlanId])
}

export function useTasks(studyPlanId?: number | null) {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await apiClient.getTasks(studyPlanId)
        if (isMounted) {
          setTasks(response.data)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setTasks([])
          setLoading(false)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [studyPlanId])

  const createTask = useMutation<Task, CreateTaskRequest>((variables) =>
    apiClient.createTask(variables),
  )

  const updateTask = useMutation<Task, { id: number; updates: UpdateTaskRequest }>((variables) =>
    apiClient.updateTask(variables.id, variables.updates),
  )

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
  }
}

export function useEvents(studyPlanId?: number | null) {
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await apiClient.getEvents(studyPlanId)
        if (isMounted) {
          setEvents(response.data)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setEvents([])
          setLoading(false)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [studyPlanId])

  const createEvent = useMutation<CalendarEvent, CreateEventRequest>((variables) =>
    apiClient.createEvent(variables),
  )

  const updateEvent = useMutation<CalendarEvent, { id: number; updates: UpdateEventRequest }>((
    variables,
  ) => apiClient.updateEvent(variables.id, variables.updates))

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
  }
}

export function useFiles(studyPlanId?: number | null) {
  return usePaginatedQuery(() => apiClient.getFiles(studyPlanId), [studyPlanId])
}

export function useLessons(studyPlanId?: number | null) {
  return usePaginatedQuery(() => apiClient.getLessons(studyPlanId), [studyPlanId])
}

export function useLessonNotes(lessonId: number) {
  return usePaginatedQuery(() => apiClient.getLessonNotes(lessonId), [lessonId])
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

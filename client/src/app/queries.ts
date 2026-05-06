import {
  QueryClient,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  readTasksFromStorage,
  readEventsFromStorage,
  readProfileFromStorage,
} from './storage'
import { Task, CalendarEvent, UserProfile } from './types'

// Create and export a singleton QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

// Query keys for organized caching
export const queryKeys = {
  all: ['app'],
  tasks: ['app', 'tasks'],
  task: (id: number) => [...queryKeys.tasks, id],
  subjects: ['app', 'subjects'],
  subject: (id: number) => [...queryKeys.subjects, id],
  events: ['app', 'events'],
  calendar: ['app', 'calendar'],
  profile: ['app', 'profile'],
} as const

// Simulated data fetching functions (replace with actual API calls later)
const fetchTasks = async (): Promise<Task[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return readTasksFromStorage() ?? []
}

const fetchEvents = async (): Promise<CalendarEvent[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return readEventsFromStorage() ?? []
}

const fetchProfile = async (): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return readProfileFromStorage() ?? {
    fullName: 'Uživatel',
    email: '',
    school: '',
    faculty: '',
    studyMajor: '',
    studyYear: '',
    studyType: '',
    birthDate: null,
    bio: '',
    avatarDataUrl: '',
  }
}

// Query hooks for tasks
export function useTasksQuery() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })
}

export function useTasksSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })
}

export function useTaskQuery(id: number) {
  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })
  return tasks.find((t) => t.id === id)
}

export function useTaskSuspense(id: number) {
  const { data: tasks } = useSuspenseQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })
  const task = tasks.find((t) => t.id === id)
  if (!task) {
    throw new Error(`Task with id ${id} not found`)
  }
  return task
}

// Query hooks for events
export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: fetchEvents,
  })
}

export function useEventsSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.events,
    queryFn: fetchEvents,
  })
}

// Query hooks for profile
export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
  })
}

export function useProfileSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
  })
}

// Mutation helpers for cache invalidation
export function invalidateTasksCache() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.tasks,
  })
}

export function invalidateEventsCache() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.events,
  })
}

export function invalidateProfileCache() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.profile,
  })
}

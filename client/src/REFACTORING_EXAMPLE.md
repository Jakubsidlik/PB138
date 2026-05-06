/**
 * EXAMPLE: Refactored Tasks Component Using React Query + Suspense
 * 
 * This file demonstrates how to convert components from the old pattern
 * (using useDashboardState with loading checks) to the new pattern
 * (using useSuspenseQuery with guaranteed data).
 * 
 * Location: src/screen/desktop/DesktopTasksRefactored.tsx
 * 
 * MIGRATION PATH:
 * 1. Create this new component alongside the old one
 * 2. Update the route to use the new component
 * 3. Delete the old component once verified working
 */

import { useSuspenseQuery } from '@tanstack/react-query'
import { queryKeys } from '../../app/queries'
import { Task } from '../../app/types'

// Step 1: Define the query function
async function fetchTasks(): Promise<Task[]> {
  // This will be replaced with actual API call later
  // For now, uses localStorage
  const { readTasksFromStorage } = await import('../../app/storage')
  return readTasksFromStorage() ?? []
}

// Step 2: Create a custom hook for better reusability
function useTasksData() {
  return useSuspenseQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })
}

// Step 3: Create the actual component - data is GUARANTEED
interface DesktopTasksRefactoredProps {
  toggleTask: (id: number) => void
  addTask: (title: string, subjectId?: number, studyPlanId?: number) => void
  deleteTask: (id: number) => void
}

export function DesktopTasksRefactored({
  toggleTask,
  addTask,
  deleteTask,
}: DesktopTasksRefactoredProps) {
  const { data: tasks } = useTasksData()

  // ✅ BENEFITS:
  // - No isLoading check needed
  // - No null coalescing (data ?? [])
  // - No error handling in component (handled by ErrorBoundary)
  // - Much cleaner and more readable code

  return (
    <div className="desktop-tasks">
      <h1>Úkoly</h1>
      
      {tasks.length === 0 ? (
        <p>Žádné úkoly. Vytvořit nový?</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className={task.done ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.title}</span>
              {task.deadline && <span className="deadline">{task.deadline}</span>}
              <button
                className="delete-btn"
                onClick={() => deleteTask(task.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * USAGE IN ROUTE:
 * 
 * src/routes/_authenticated/tasks/index.tsx
 * 
 * import { createRoute } from '@tanstack/react-router'
 * import { DesktopTasksRefactored } from '../../../screen/desktop/DesktopTasksRefactored'
 * import { QuerySuspense } from '../../../components/shared/QuerySuspense'
 * import { queryClient, queryKeys } from '../../../app/queries'
 * 
 * async function tasksLoader() {
 *   return queryClient.ensureQueryData({
 *     queryKey: queryKeys.tasks,
 *     queryFn: fetchTasks,
 *   })
 * }
 * 
 * export const Route = createRoute({
 *   path: '/tasks',
 *   component: TasksRouteComponent,
 *   loader: tasksLoader,
 * })
 * 
 * function TasksRouteComponent() {
 *   const state = useDashboardState() // Still need for mutations
 *   
 *   return (
 *     <QuerySuspense loadingMessage="Načítám úkoly...">
 *       <DesktopTasksRefactored
 *         toggleTask={state.toggleTask}
 *         addTask={state.addTask}
 *         deleteTask={state.deleteTask}
 *       />
 *     </QuerySuspense>
 *   )
 * }
 */

/**
 * COMPARISON: OLD vs NEW
 * 
 * OLD PATTERN (with loading state):
 * ```tsx
 * function DesktopTasks({ toggleTask, addTask, deleteTask }) {
 *   const state = useDashboardState()
 *   
 *   if (!state.tasks) {
 *     return <div>Loading...</div>
 *   }
 *   
 *   return (
 *     <ul>
 *       {state.tasks.map(task => (...))}
 *     </ul>
 *   )
 * }
 * ```
 * 
 * NEW PATTERN (guaranteed data):
 * ```tsx
 * function DesktopTasksRefactored({ toggleTask, addTask, deleteTask }) {
 *   const { data: tasks } = useSuspenseQuery(...)
 *   
 *   // No loading check needed!
 *   return (
 *     <ul>
 *       {tasks.map(task => (...))}
 *     </ul>
 *   )
 * }
 * ```
 * 
 * CODE REDUCTION: ~10 lines per component!
 */

/**
 * WHEN TO REFACTOR:
 * 
 * Priority 1 (High-traffic pages):
 * - Tasks list
 * - Dashboard
 * - Calendar
 * 
 * Priority 2 (Medium-traffic):
 * - Study plan
 * - Files
 * 
 * Priority 3 (Low-traffic):
 * - Profile
 * - Settings
 */

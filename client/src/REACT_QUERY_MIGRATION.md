# React Query + Loaders + Suspense Integration Guide

## Overview
This guide explains the new data loading architecture with:
- **React Query** for caching and data management
- **TanStack Router Loaders** for pre-fetching data before route renders
- **Suspense** for displaying loading states and error handling

## Setup Complete ✅

### 1. QueryClient Configuration
- Located in: `src/app/queries.ts`
- Singleton instance ready for use
- Default cache: 5 minutes stale time, 10 minutes gc time

### 2. Query Keys Organization
```typescript
queryKeys = {
  all: ['app'],
  tasks: ['app', 'tasks'],
  task: (id) => [...queryKeys.tasks, id],
  events: ['app', 'events'],
  calendar: ['app', 'calendar'],
  profile: ['app', 'profile'],
}
```

### 3. Query Hooks Available
- `useTasksQuery()` - Regular query with loading state
- `useTasksSuspense()` - Suspense query (data guaranteed)
- `useEventsQuery()` - Regular query
- `useEventsSuspense()` - Suspense query
- `useProfileQuery()` - Regular query
- `useProfileSuspense()` - Suspense query

### 4. App Setup
- `App.tsx` now wraps router with `QueryClientProvider`
- QueryClient is shared globally

## Routes with Loaders

### Dashboard Route (`src/routes/_authenticated/index.tsx`)
- **Loader**: Pre-fetches tasks and events
- **Data guaranteed** when component renders
- No loading spinner on initial navigation

### Calendar Route (`src/routes/_authenticated/calendar.tsx`)
- **Loader**: Pre-fetches events
- **Data guaranteed** when component renders

### Tasks Route (`src/routes/_authenticated/tasks/index.tsx`)
- **Loader**: Pre-fetches tasks
- **Data guaranteed** when component renders

### Task Detail Route (`src/routes/_authenticated/tasks/$taskId.tsx`)
- **Loader**: Pre-fetches tasks
- **Data guaranteed** when component renders

## Migration Path

### Phase 1: Components with Suspense (Recommended)
Use when you want to leverage the loader's pre-fetched data:

```typescript
// ✅ RECOMMENDED PATTERN
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTasksSuspense } from '../../../app/queries'

function TasksList() {
  // Data is guaranteed to exist because loader pre-fetched it
  const { data: tasks } = useSuspenseQuery({
    queryKey: ['app', 'tasks'],
    queryFn: fetchTasks,
  })

  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}

// Wrap with Suspense in route or parent:
export function Route = createRoute({
  component: () => (
    <QuerySuspense loadingMessage="Načítám úkoly...">
      <TasksList />
    </QuerySuspense>
  ),
})
```

### Phase 2: Legacy Pattern (Current - Still Works)
Current state loading from localStorage remains functional:

```typescript
// ⚠️ LEGACY - Still works but will show loading states
import { useDashboardState } from '../app/useDashboardState'

function TasksList() {
  const state = useDashboardState()
  
  return (
    <ul>
      {state.tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

## Step-by-Step Migration

### Step 1: Add QuerySuspense to Route Component
```typescript
// routes/_authenticated/index.tsx
import { QuerySuspense } from '../../../components/shared/QuerySuspense'

function DashboardComponent() {
  // ... existing code
}

export const Route = createRoute({
  path: '/',
  component: () => (
    <QuerySuspense loadingMessage="Načítám dashboard...">
      <DashboardComponent />
    </QuerySuspense>
  ),
  loader: dashboardLoader,
})
```

### Step 2: Update Individual Components to Use useSuspenseQuery
```typescript
// components/shared/TasksList.tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../app/queries'

function TasksList() {
  const { data: tasks } = useSuspenseQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const { readTasksFromStorage } = await import('../../../app/storage')
      return readTasksFromStorage() ?? []
    },
  })

  // Data guaranteed - no need for isLoading check
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

### Step 3: Gradually Remove useDashboardState
Replace prop drilling with direct query hooks in child components:

```typescript
// BEFORE: Prop drilling
function ParentComponent() {
  const state = useDashboardState()
  return <ChildComponent tasks={state.tasks} />
}

// AFTER: Direct query
function ChildComponent() {
  const { data: tasks } = useSuspenseQuery(...)
  return <ul>{tasks.map(...)}</ul>
}
```

## Benefits Achieved

✅ **No Loading Spinners on Route Navigation**
- Data pre-fetched in loader before component renders

✅ **Guaranteed Data Availability**
- Components don't need null checks or loading states

✅ **Cleaner Component Code**
- Remove `if (isLoading) return <Spinner />`
- Simpler props, easier to test

✅ **Better Error Handling**
- Error boundaries catch and display errors gracefully

✅ **Efficient Caching**
- Same data reused across multiple routes
- Automatic cache invalidation

✅ **Future API Integration Ready**
- Replace `readTasksFromStorage()` with `fetchTasksFromAPI()`
- No component code changes needed

## Current Data Flow

```
User navigates to /tasks
    ↓
Router calls tasksLoader()
    ↓
Loader calls queryClient.ensureQueryData()
    ↓
Data is fetched and cached
    ↓
Component renders (data guaranteed)
    ↓
useSuspenseQuery() returns cached data
    ↓
UI displays without loading state
```

## Next Steps

1. **Wrap route components with QuerySuspense**
   - Start with high-traffic routes
   - Provides immediate UX benefit

2. **Update individual components to use useSuspenseQuery**
   - Removes prop drilling
   - Simplifies component logic
   - Enables better testing

3. **Replace localStorage with API calls**
   - Update queryFn in queries.ts
   - All components automatically use new data source
   - No changes needed in components

4. **Add cache invalidation**
   - After mutations, call invalidateTasksCache()
   - Ensures fresh data on operations like add/delete/update

## Example: Complete Flow for Tasks Page

```typescript
// 1. Route definition
export const Route = createRoute({
  path: '/tasks',
  component: TasksPageWrapper,
  loader: tasksLoader, // Pre-fetches data
})

// 2. Route component with Suspense
function TasksPageWrapper() {
  return (
    <QuerySuspense loadingMessage="Načítám úkoly...">
      <TasksPage />
    </QuerySuspense>
  )
}

// 3. Page component using suspense query
function TasksPage() {
  const { data: tasks } = useSuspenseQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
  })

  // Data guaranteed - no loading checks
  return (
    <div>
      <h1>Úkoly ({tasks.length})</h1>
      <TasksList tasks={tasks} />
    </div>
  )
}

// 4. Child components receive data directly
function TasksList({ tasks }: { tasks: Task[] }) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

## Troubleshooting

### "Data is undefined"
→ You're not using `useSuspenseQuery` in a Suspense boundary
→ Wrap component with `<QuerySuspense>`

### "Loading spinner never disappears"
→ Check that loader is actually calling `ensureQueryData()`
→ Verify queryKey in loader matches queryKey in component

### "Stale data being shown"
→ After mutations, call `invalidateTasksCache()`
→ This triggers refetch and shows fresh data

import React, { Suspense, ReactNode } from 'react'

/**
 * Loading fallback component shown while data is being fetched
 */
export function LoadingFallback({ message = 'Načítám...' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '2rem',
        textAlign: 'center',
        color: '#888',
      }}
    >
      <div>
        <div style={{ marginBottom: '1rem' }}>⏳</div>
        <p>{message}</p>
      </div>
    </div>
  )
}

/**
 * Error fallback component shown when data fetching fails
 */
export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '2rem',
        textAlign: 'center',
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        borderRadius: '4px',
        margin: '1rem',
      }}
    >
      <div>
        <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⚠️</div>
        <p style={{ marginBottom: '0.5rem' }}>Chyba při načítání dat</p>
        <details style={{ textAlign: 'left', fontSize: '0.875rem' }}>
          <summary style={{ cursor: 'pointer', color: '#1976d2' }}>Detaily chyby</summary>
          <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fafafa', overflow: 'auto' }}>
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  )
}

interface QuerySuspenseProps {
  children: ReactNode
  loadingMessage?: string
}

/**
 * Wrapper component that provides Suspense boundary with loading and error handling
 * 
 * Usage:
 * ```tsx
 * <QuerySuspense loadingMessage="Načítám data...">
 *   <YourComponent />
 * </QuerySuspense>
 * ```
 */
export function QuerySuspense({ children, loadingMessage = 'Načítám...' }: QuerySuspenseProps) {
  return (
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

/**
 * Error boundary for catching errors in suspense components
 */
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Error in component:', error)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

/**
 * MIGRATION GUIDE: Using useSuspenseQuery instead of useQuery
 * 
 * BEFORE (with loading state):
 * ```tsx
 * function TasksList() {
 *   const { data: tasks = [], isLoading } = useQuery({
 *     queryKey: ['tasks'],
 *     queryFn: fetchTasks,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   
 *   return <div>{tasks.map(t => <div key={t.id}>{t.title}</div>)}</div>
 * }
 * ```
 *
 * AFTER (with suspense):
 * ```tsx
 * function TasksList() {
 *   const { data: tasks } = useSuspenseQuery({
 *     queryKey: ['tasks'],
 *     queryFn: fetchTasks,
 *   })
 *   
 *   // No need for isLoading check - data is guaranteed
 *   return <div>{tasks.map(t => <div key={t.id}>{t.title}</div>)}</div>
 * }
 *
 * // Use the component with Suspense boundary:
 * function App() {
 *   return (
 *     <QuerySuspense>
 *       <TasksList />
 *     </QuerySuspense>
 *   )
 * }
 * ```
 *
 * BENEFITS:
 * - Data is guaranteed to be available (no null checks needed)
 * - Cleaner component code (no isLoading, isError states)
 * - Better UX with Suspense fallback during loading
 * - Easier error handling with Error Boundaries
 */

import React, { Suspense, ReactNode } from 'react'

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

export function QuerySuspense({ children, loadingMessage = 'Načítám...' }: QuerySuspenseProps) {
  return (
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

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



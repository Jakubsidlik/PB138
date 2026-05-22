
import { useRouter } from '@tanstack/react-router'

type ErrorComponentProps = {
  error: Error
}

export function ErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter()

  const handleRetry = () => {
    router.invalidate()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            margin: '0 0 0.5rem 0',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
          }}
        >
          Něco se pokazilo
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            margin: '0 0 1.5rem 0',
            fontSize: '0.875rem',
          }}
        >
          {error?.message || 'Došlo k neznámé chybě. Prosím, zkuste znovu.'}
        </p>
        <button
          onClick={handleRetry}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1'
          }}
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  )
}

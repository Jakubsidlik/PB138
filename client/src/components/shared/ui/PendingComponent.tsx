

export function PendingComponent() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="var(--bg-subtle)"
              strokeWidth="2"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeDasharray="30.984"
              strokeDashoffset="0"
            />
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
          Načítání...
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

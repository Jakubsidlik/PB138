import { createContext, useContext, ReactNode } from 'react'
import { useDashboardState } from './useDashboardState'

// Type of the state returned by useDashboardState
type DashboardState = ReturnType<typeof useDashboardState>

const DashboardContext = createContext<DashboardState | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  // We initialize with fetchAll = true because this is the global state
  const state = useDashboardState(true)

  return (
    <DashboardContext.Provider value={state}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

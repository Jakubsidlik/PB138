import { createContext, useContext, ReactNode } from 'react'
import { useDashboardState } from './useDashboardState'

type DashboardState = ReturnType<typeof useDashboardState>

const DashboardContext = createContext<DashboardState | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
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

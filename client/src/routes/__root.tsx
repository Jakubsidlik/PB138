import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { RootLayout } from '../components/layout/RootLayout'
import { QuerySuspense } from '../components/shared/ui/QuerySuspense'
import { ErrorComponent } from '../components/shared/ui/ErrorComponent'

function RootComponent() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return (
      <QuerySuspense>
        <Outlet />
      </QuerySuspense>
    )
  }

  return (
    <QuerySuspense>
      <RootLayout />
    </QuerySuspense>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
})

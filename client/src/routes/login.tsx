import { createRoute } from '@tanstack/react-router'
import { AuthScreen } from '../components/authentication/AuthScreen'
import { Route as RootRoute } from './__root'

function LoginComponent() {
  return <AuthScreen />
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/login',
  component: LoginComponent,
})

import { createFileRoute } from '@tanstack/react-router'
import { AuthScreen } from '../components/authentication/AuthScreen'

export const Route = createFileRoute('/login')({
  component: () => <AuthScreen />,
})
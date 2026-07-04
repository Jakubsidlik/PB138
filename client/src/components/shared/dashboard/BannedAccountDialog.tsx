import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import { useDashboard } from '../../../app/DashboardContext'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from '@tanstack/react-router'

export function BannedAccountDialog() {
  const { isBanned, setIsBanned, setAuthSession } = useDashboard()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setIsBanned(false)
    setAuthSession(null)
    navigate({ to: '/login' })
  }

  return (
    <AlertDialog open={isBanned}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Účet byl odstraněn</AlertDialogTitle>
          <AlertDialogDescription>
            Tento účet byl zablokován nebo smazán administrátorem. 
            Již nemáte přístup do aplikace pod touto e-mailovou adresou.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleSignOut}>Odhlásit se</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

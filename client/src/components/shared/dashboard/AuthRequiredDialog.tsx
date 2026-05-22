import React from 'react'
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

export function AuthRequiredDialog() {
  const { authAlertOpen, setAuthAlertOpen } = useDashboard()

  return (
    <AlertDialog open={authAlertOpen} onOpenChange={setAuthAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Přístup odepřen</AlertDialogTitle>
          <AlertDialogDescription>
            Pro provedení této akce nemáte dostatečná oprávnění. 
            Pokud je váš účet smazán administrátorem, nebudete moci přidávat, upravovat ani mazat žádná data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setAuthAlertOpen(false)}>Rozumím</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { User, FileRecord } from '../app/types'
import { Shield, Trash2, UserMinus, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useDashboard } from '../app/DashboardContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from '../components/ui/alert-dialog'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

export function AdminDashboardScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [avatarToDelete, setAvatarToDelete] = useState<number | null>(null)

  const { apiFetch } = useDashboard()

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    setError(null)
    try {
      const res = await apiFetch('/api/users')
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Chyba ${res.status}`)
      }
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      console.error('Failed to load users:', err)
      setError('Nepodařilo se načíst uživatele. Pravděpodobně nemáte oprávnění admina.')
    } finally {
      setLoadingUsers(false)
    }
  }, [apiFetch])

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true)
    try {
      const res = await apiFetch('/api/admin/files')
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Chyba ${res.status}`)
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setFiles(data)
      } else if (data && 'data' in data && Array.isArray(data.data)) {
        setFiles(data.data)
      }
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoadingFiles(false)
    }
  }, [apiFetch])

  useEffect(() => {
    loadUsers()
    loadFiles()
  }, [loadUsers, loadFiles])

  const confirmDeleteAvatar = async () => {
    if (!avatarToDelete) return
    try {
      const res = await apiFetch(`/api/users/${avatarToDelete}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarDataUrl: null }),
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === avatarToDelete ? { ...u, avatarDataUrl: null } : u))
      }
    } catch (err) {
      console.error('Failed to delete avatar:', err)
    } finally {
      setAvatarToDelete(null)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    try {
      const res = await apiFetch(`/api/users/${userToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete))
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setUserToDelete(null)
    }
  }

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    try {
      const res = await apiFetch(`/api/files/${fileToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles(files.filter(f => f.id !== fileToDelete))
      }
    } catch (err) {
      console.error('Failed to delete file:', err)
    } finally {
      setFileToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="w-full px-8 py-6 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">Administrátorský panel</h1>
          </div>
          <Button 
            variant="secondary"
            onClick={() => window.location.href = '/'} 
          >
            Zpět na web
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertTriangle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Users Section */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <CardTitle className="text-xl font-semibold">Správa uživatelů</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadUsers} 
              className="rounded-full"
            >
              <RefreshCw className={`size-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Jméno</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1">
                      {user.avatarDataUrl && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => setAvatarToDelete(user.id)}
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          title="Smazat profilovou fotku"
                        >
                          <ImageOff className="size-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => setUserToDelete(user.id)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        title="Smazat uživatele"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loadingUsers && !error && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Žádní uživatelé nenalezeni.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <CardTitle className="text-xl font-semibold">Správa souborů</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadFiles} 
              className="rounded-full"
            >
              <RefreshCw className={`size-4 ${loadingFiles ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Název</th>
                  <th className="px-4 py-3 text-left">Velikost</th>
                  <th className="px-4 py-3 text-left">Vlastník</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {files.length === 0 && !loadingFiles && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Žádné soubory nebyly nalezeny.
                    </td>
                  </tr>
                )}
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{file.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{file.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{file.userEmail || file.userId}</td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => setFileToDelete(file.id)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        title="Smazat soubor"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Alert Dialog for File Deletion */}
      <AlertDialog open={fileToDelete !== null} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Opravdu chcete smazat tento soubor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná a soubor bude trvale smazán ze systému.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              onClick={confirmDeleteFile}
            >
              Smazat soubor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for User Deletion */}
      <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <UserMinus className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Opravdu chcete smazat tohoto uživatele?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Dojde k trvalému smazání uživatelského účtu a všech přidružených dat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              onClick={confirmDeleteUser}
            >
              Smazat uživatele
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for Avatar Deletion */}
      <AlertDialog open={avatarToDelete !== null} onOpenChange={() => setAvatarToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-500/10 text-amber-500">
              <ImageOff className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Smazat profilovou fotku?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce odstraní aktuální profilovou fotku uživatele. Uživatel si ji bude moci nahrát znovu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAvatar}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Smazat fotku
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

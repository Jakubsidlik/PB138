import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [avatarToDelete, setAvatarToDelete] = useState<number | null>(null)

  // Sorting states for users
  type UserSortField = 'fullName' | 'email'
  type UserSortOrder = 'asc' | 'desc'
  const [userSortField, setUserSortField] = useState<UserSortField>('fullName')
  const [userSortOrder, setUserSortOrder] = useState<UserSortOrder>('asc')

  // Sorting states for files
  type FileSortField = 'name' | 'size' | 'owner'
  type FileSortOrder = 'asc' | 'desc'
  const [fileSortField, setFileSortField] = useState<FileSortField>('name')
  const [fileSortOrder, setFileSortOrder] = useState<FileSortOrder>('asc')

  const { apiFetch } = useDashboard()

  const handleUserSort = (field: UserSortField) => {
    if (userSortField === field) {
      setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setUserSortField(field)
      setUserSortOrder('asc')
    }
  }

  const renderUserSortIcon = (field: UserSortField) => {
    if (userSortField !== field) return <span className="opacity-30 ml-1 text-xs">↕</span>
    return userSortOrder === 'asc' ? <span className="text-primary ml-1 text-xs">↑</span> : <span className="text-primary ml-1 text-xs">↓</span>
  }

  const handleFileSort = (field: FileSortField) => {
    if (fileSortField === field) {
      setFileSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setFileSortField(field)
      setFileSortOrder('asc')
    }
  }

  const renderFileSortIcon = (field: FileSortField) => {
    if (fileSortField !== field) return <span className="opacity-30 ml-1 text-xs">↕</span>
    return fileSortOrder === 'asc' ? <span className="text-primary ml-1 text-xs">↑</span> : <span className="text-primary ml-1 text-xs">↓</span>
  }

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0
    if (userSortField === 'fullName') {
      comparison = a.fullName.localeCompare(b.fullName, 'cs')
    } else if (userSortField === 'email') {
      comparison = a.email.localeCompare(b.email, 'cs')
    }
    return userSortOrder === 'asc' ? comparison : -comparison
  })

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0
    if (fileSortField === 'name') {
      comparison = a.name.localeCompare(b.name, 'cs')
    } else if (fileSortField === 'size') {
      comparison = (a.sizeBytes || 0) - (b.sizeBytes || 0)
    } else if (fileSortField === 'owner') {
      const ownerA = a.userEmail || String(a.userId || '')
      const ownerB = b.userEmail || String(b.userId || '')
      comparison = ownerA.localeCompare(ownerB, 'cs')
    }
    return fileSortOrder === 'asc' ? comparison : -comparison
  })

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
            onClick={() => navigate({ to: '/' })} 
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
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleUserSort('fullName')}
                    >
                      Jméno {renderUserSortIcon('fullName')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleUserSort('email')}
                    >
                      Email {renderUserSortIcon('email')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right w-20">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium truncate">{user.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate">{user.email}</td>
                    <td className="px-4 py-3 text-right w-20">
                      <div className="flex justify-end gap-1 flex-nowrap">
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
                      </div>
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
          
          <CardContent className="p-0 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <div
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleFileSort('name')}
                    >
                      Název {renderFileSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell w-24">
                    <div
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleFileSort('size')}
                    >
                      Velikost {renderFileSortIcon('size')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <div
                      className="flex items-center cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleFileSort('owner')}
                    >
                      Vlastník {renderFileSortIcon('owner')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right w-16">Akce</th>
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
                {sortedFiles.map(file => (
                  <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium truncate">{file.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{file.size}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate">{file.userEmail || file.userId}</td>
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

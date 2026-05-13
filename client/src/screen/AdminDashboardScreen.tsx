import React, { useEffect, useState } from 'react'
import { apiClient as api } from '../app/api'
import { User, FileRecord } from '../app/types'
import { Shield, Trash2, UserMinus, ImageOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'

export function AdminDashboardScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const { getToken, isLoaded } = useAuth()

  useEffect(() => {
    if (!isLoaded) return

    const updateToken = async () => {
      try {
        const token = await getToken()
        api.setToken(token)
        loadUsers()
        loadFiles()
      } catch (err) {
        console.error('Failed to get token:', err)
        setError('Nepodařilo se ověřit přihlášení.')
      }
    }
    updateToken()
  }, [getToken, isLoaded])

  const loadUsers = async () => {
    setLoadingUsers(true)
    setError(null)
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (error: any) {
      console.error('Failed to load users:', error)
      setError('Nepodařilo se načíst uživatele. Pravděpodobně nemáte oprávnění admina.')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadFiles = async () => {
    setLoadingFiles(true)
    try {
      const data = await api.getAdminFiles()
      console.log('Admin files data:', data)
      if ('data' in data) {
        setFiles(data.data)
      } else {
        setFiles(data as unknown as FileRecord[])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      // Nechceme přepsat chybu z uživatelů, pokud už tam je
      if (!error) setError('Nepodařilo se načíst soubory.')
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleDeleteAvatar = async (userId: number) => {
    if (!confirm('Opravdu chcete smazat profilovou fotku tohoto uživatele?')) return
    try {
      await api.adminUpdateUser(userId, { avatarDataUrl: null })
      setUsers(users.map(u => u.id === userId ? { ...u, avatarDataUrl: null } : u))
    } catch (error) {
      console.error('Failed to delete avatar:', error)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Opravdu chcete smazat tohoto uživatele? Tato akce je nevratná.')) return
    try {
      await api.adminDeleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    setFileToDelete(fileId)
  }

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    try {
      await api.deleteFile(fileToDelete)
      setFiles(files.filter(f => f.id !== fileToDelete))
    } catch (error) {
      console.error('Failed to delete file:', error)
    } finally {
      setFileToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">Administrátorský panel</h1>
          </div>
          <button 
            onClick={() => window.location.href = '/'} 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Zpět na web
          </button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertTriangle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Users Section */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold">Správa uživatelů</h2>
            <button onClick={loadUsers} className="p-2 hover:bg-muted rounded-full transition-colors">
              <RefreshCw className={`size-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Jméno</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      {user.avatarDataUrl && (
                        <button 
                          onClick={() => handleDeleteAvatar(user.id)}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Smazat profilovou fotku"
                        >
                          <ImageOff className="size-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Smazat uživatele"
                      >
                        <UserMinus className="size-4" />
                      </button>
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
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold">Správa souborů</h2>
            <button onClick={loadFiles} className="p-2 hover:bg-muted rounded-full transition-colors">
              <RefreshCw className={`size-4 ${loadingFiles ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Název</th>
                  <th className="px-4 py-3 text-left">Velikost</th>
                  <th className="px-4 py-3 text-left">Vlastník (ID)</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {files.length === 0 && !loadingFiles && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Žádné soubory nebyly nalezeny.
                    </td>
                  </tr>
                )}
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{file.id}</td>
                    <td className="px-4 py-3 font-medium">{file.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{file.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{file.userId}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Smazat soubor"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && !loadingFiles && !error && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Žádné soubory nenalezeny.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert Dialog for File Deletion */}
      <AlertDialog open={fileToDelete !== null} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat tento soubor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná a soubor bude trvale smazán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

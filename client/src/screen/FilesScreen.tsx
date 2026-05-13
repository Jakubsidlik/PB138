import React from 'react'
import { Button } from '../components/ui/button'
import { ManagedFile, Subject } from '../app/types'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu'
import { getFileIcon } from '../components/shared/files/fileUtils'
import { HiddenFileInput } from '../components/shared/files/HiddenFileInput'
import { ShareFileModal } from '../components/shared/files/ShareFileModal'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
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
import { Input } from '../components/ui/input'
import { Share, Trash2 } from 'lucide-react'

type DesktopFilesScreenProps = {
  managedFiles: ManagedFile[]
  subjects: Subject[]
  fileInputRef: React.RefObject<HTMLInputElement>
  onUploadFiles: (files: FileList | null) => void
  onRenameFile: (fileId: number, newName: string) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number, email?: string) => Promise<void>
  onChangeFileSubject: (fileId: number, subjectId: number | null) => void
}

export function DesktopFilesScreen({
  managedFiles,
  subjects,
  fileInputRef,
  onUploadFiles,
  onRenameFile,
  onDeleteFile,
  onToggleFileShared,
  onChangeFileSubject,
}: DesktopFilesScreenProps) {
  const [shareModalFileId, setShareModalFileId] = useState<number | null>(null)
  const [renamingFileId, setRenamingFileId] = useState<number | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null)

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (renamingFileId && newFileName.trim()) {
      onRenameFile(renamingFileId, newFileName)
      setRenamingFileId(null)
    }
  }

  const rows = managedFiles

  return (
    <section className="flex flex-col gap-6 w-full px-8 pt-6 pb-10" id="desktop-files">
      <div className="flex flex-col gap-1 pl-2 md:pl-4">
        <h2 className="text-2xl font-bold tracking-tight">Moje soubory</h2>
        <p className="text-muted-foreground">Správa studijních materiálů a sdílení souborů.</p>
      </div>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border shadow-sm bg-card">
          <div className="p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">Přehled souborů</h3>
          </div>

          <div className="p-4 sm:p-6 pt-0 overflow-x-auto">
            {rows.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Zatím nejsou dostupné žádné soubory.</p>
            ) : (
              <div className="w-full min-w-[600px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 py-3 border-b text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  <div>Název souboru</div>
                  <div>Předmět</div>
                  <div>Změna</div>
                  <div>Velikost</div>
                  <div className="text-right pr-2">Akce</div>
                </div>
                
                <div className="flex flex-col">
                  {rows.map((file) => {
                    const { icon, tone } = getFileIcon(file.category)
                    const subject = subjects.find(s => s.id === file.subjectId)
                    const subjectCode = subject ? subject.code : 'N/A'
                    
                    let bgToneClass = "bg-primary/10 text-primary"
                    if (tone === "accent-amber") bgToneClass = "bg-amber-500/10 text-amber-600"
                    if (tone === "accent-emerald") bgToneClass = "bg-emerald-500/10 text-emerald-600"

                    return (
                      <div key={file.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 py-3 items-center border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${bgToneClass}`}>
                            {icon}
                          </span>
                          <span className="font-medium text-sm truncate">{file.name}</span>
                        </div>
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-xs font-semibold cursor-pointer transition-colors" title="Přiřadit k předmětu">
                                {subjectCode}
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
                              <DropdownMenuItem onClick={() => onChangeFileSubject(file.id, null)}>
                                N/A (Bez předmětu)
                              </DropdownMenuItem>
                              {subjects.map(sub => (
                                <DropdownMenuItem key={sub.id} onClick={() => onChangeFileSubject(file.id, sub.id)}>
                                  {sub.code} - {sub.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="text-sm text-muted-foreground">{file.addedLabel}</div>
                        <div className="text-sm text-muted-foreground">{file.size}</div>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => setShareModalFileId(file.id)}
                            title="Sdílet soubor s konkrétním uživatelem"
                          >
                            <Share className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setRenamingFileId(file.id)
                              setNewFileName(file.name)
                            }}
                            title="Přejmenovat"
                          >
                            ✎
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingFileId(file.id)}
                            title="Smazat"
                          >
                            🗑
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border shadow-sm bg-card p-6 flex flex-col gap-4 text-center items-center justify-center border-dashed border-2 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer max-w-2xl mx-auto w-full" onClick={() => fileInputRef.current?.click()}>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-2">☁️</div>
          <h3 className="font-semibold text-lg m-0">Rychlé nahrávání</h3>
          <p className="text-sm text-muted-foreground mb-2">Přetáhněte soubory sem nebo klikněte pro výběr z počítače.</p>
          <Button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Procházet soubory
          </Button>
          <HiddenFileInput
            inputRef={fileInputRef}
            multiple
            onChange={onUploadFiles}
          />
        </section>
      </div>

      {shareModalFileId && (() => {
        const targetFile = managedFiles.find(f => f.id === shareModalFileId)
        return (
          <ShareFileModal
            isOpen={!!shareModalFileId}
            onClose={() => setShareModalFileId(null)}
            onShare={async (email) => {
              await onToggleFileShared(shareModalFileId, email)
            }}
            fileName={targetFile?.name || 'Soubor'}
          />
        )
      })()}

      <Dialog open={!!renamingFileId} onOpenChange={(open) => !open && setRenamingFileId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Přejmenovat soubor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Nový název souboru</label>
                <Input 
                  value={newFileName} 
                  onChange={e => setNewFileName(e.target.value)} 
                  autoFocus 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newFileName.trim()}>Uložit změny</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingFileId} onOpenChange={(open) => !open && setDeletingFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Smazat soubor</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat tento soubor? Tato akce je nevratná a soubor bude trvale odstraněn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              onClick={() => {
                if (deletingFileId) {
                  onDeleteFile(deletingFileId);
                  setDeletingFileId(null);
                }
              }}
            >
              Smazat soubor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}



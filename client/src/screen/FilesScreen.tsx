import React from 'react'
import { Button } from '../components/ui/button'
import { ManagedFile } from '../app/types'
import { getFileIcon } from '../components/shared/fileUtils'
import { HiddenFileInput } from '../components/shared/HiddenFileInput'
import { ShareFileModal } from '../components/shared/ShareFileModal'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'

type DesktopFilesScreenProps = {
  managedFiles: ManagedFile[]
  fileInputRef: React.RefObject<HTMLInputElement>
  onUploadFiles: (files: FileList | null) => void
  onRenameFile: (fileId: number, newName: string) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number, email?: string) => Promise<void>
}

export function DesktopFilesScreen({
  managedFiles,
  fileInputRef,
  onUploadFiles,
  onRenameFile,
  onDeleteFile,
  onToggleFileShared,
}: DesktopFilesScreenProps) {
  const [shareModalFileId, setShareModalFileId] = useState<number | null>(null)
  const [renamingFileId, setRenamingFileId] = useState<number | null>(null)
  const [newFileName, setNewFileName] = useState('')

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (renamingFileId && newFileName.trim()) {
      onRenameFile(renamingFileId, newFileName)
      setRenamingFileId(null)
    }
  }

  const rows = managedFiles

  return (
    <section className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10" id="desktop-files">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Moje soubory</h2>
        <p className="text-muted-foreground">Správa studijních materiálů a sdílení souborů.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
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
                    const subjectCode = file.subjectId ? `SUB-${file.subjectId}` : 'N/A'
                    
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
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-muted text-xs font-semibold">{subjectCode}</span>
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
                            {file.shared ? '👥' : '🔒'}
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
                            onClick={() => onDeleteFile(file.id)}
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

        <section className="rounded-xl border shadow-sm bg-card p-6 flex flex-col gap-4 text-center items-center justify-center border-dashed border-2 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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

      {shareModalFileId && (
        <ShareFileModal
          isOpen={!!shareModalFileId}
          onClose={() => setShareModalFileId(null)}
          onShare={async (email) => {
            await onToggleFileShared(shareModalFileId, email)
          }}
          fileName={managedFiles.find(f => f.id === shareModalFileId)?.name || 'Soubor'}
        />
      )}

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
    </section>
  )
}



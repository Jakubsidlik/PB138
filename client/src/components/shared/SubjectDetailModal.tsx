import React from 'react'
import { Subject, ManagedFile, Lesson } from '../../app/types'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { ScrollArea } from "../ui/scroll-area"

type SubjectDetailModalProps = {
  subject: Subject | null
  files: ManagedFile[]
  lessons: Lesson[]
  onClose: () => void
  onAddNote?: (subjectId: number, note: string) => void
  onAddFile?: (subjectId: number, file: File) => void
}

export function SubjectDetailModal({ 
  subject, 
  files, 
  lessons,
  onClose,
  onAddNote,
  onAddFile,
}: SubjectDetailModalProps) {
  const [noteText, setNoteText] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!subject) {
    return null
  }

  const subjectFiles = files.filter((file) => file.subjectId === subject.id)
  const subjectLessons = lessons.filter((lesson) => lesson.subjectId === subject.id)

  const handleAddNote = () => {
    if (!noteText.trim()) {
      return
    }

    onAddNote?.(subject.id, noteText)
    setNoteText('')
  }

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    onAddFile?.(subject.id, file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={!!subject} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">{subject.name}</DialogTitle>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <p><strong>Kód:</strong> {subject.code}</p>
            <p><strong>Učitel:</strong> {subject.teacher}</p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Soubory */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">📄 Soubory ({subjectFiles.length})</h3>
              {subjectFiles.length > 0 ? (
                <ul className="space-y-2">
                  {subjectFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">{file.size}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Zatím žádné soubory</p>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAddFile}
                  style={{ display: 'none' }}
                />
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  + Přidat soubor
                </Button>
              </div>
            </div>

            {/* Poznámky */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">📝 Poznámky ({subjectLessons.length})</h3>
              
              <div className="space-y-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Napište poznámku..."
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="w-full sm:w-auto"
                >
                  Přidat poznámku
                </Button>
              </div>

              {subjectLessons.length > 0 ? (
                <ul className="space-y-3">
                  {subjectLessons.map((lesson) => (
                    <li key={lesson.id} className="p-4 rounded-lg border bg-card">
                      <p className="text-sm leading-relaxed">{lesson.content || lesson.title}</p>
                      <div className="mt-2 text-[10px] text-muted-foreground text-right">
                        {new Date(lesson.createdAt!).toLocaleDateString('cs-CZ')} {new Date(lesson.createdAt!).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Zatím žádné poznámky</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="ghost" onClick={onClose}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

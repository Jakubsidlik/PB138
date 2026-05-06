import React from 'react'
import { Subject, ManagedFile, Lesson } from '../../app/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

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

  if (!subject) return null

  const subjectFiles = files.filter((file) => file.subjectId === subject.id)
  const subjectLessons = lessons.filter((lesson) => lesson.subjectId === subject.id)

  const handleAddNote = () => {
    if (!noteText.trim()) return
    onAddNote?.(subject.id, noteText)
    setNoteText('')
  }

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onAddFile?.(subject.id, file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={!!subject} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{subject.name}</DialogTitle>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <p><strong>Kód:</strong> {subject.code}</p>
            <p><strong>Učitel:</strong> {subject.teacher}</p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Sekce Soubory */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                📄 Soubory ({subjectFiles.length})
              </h3>
              
              {subjectFiles.length > 0 ? (
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {subjectFiles.map((file) => (
                    <li key={file.id} className="flex justify-between p-2 border rounded-md bg-subtle/30">
                      <span className="font-medium">{file.name}</span>
                      <span>{file.size}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-muted-foreground">Zatím žádné soubory</p>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddFile}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                + Přidat soubor
              </Button>
            </section>

            {/* Sekce Poznámky */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                📝 Poznámky ({subjectLessons.length})
              </h3>
              
              <div className="grid gap-2">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Napište poznámku..."
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!noteText.trim()}
                  className="justify-self-end"
                >
                  Přidat poznámku
                </Button>
              </div>

              {subjectLessons.length > 0 ? (
                <ul className="grid gap-3 mt-4">
                  {subjectLessons.map((lesson) => (
                    <li key={lesson.id} className="p-3 border rounded-lg bg-card">
                      <p className="text-sm mb-2">{lesson.content || lesson.title}</p>
                      <time className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {new Date(lesson.createdAt!).toLocaleDateString('cs-CZ')} {new Date(lesson.createdAt!).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-muted-foreground">Zatím žádné poznámky</p>
              )}
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Zavřít</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

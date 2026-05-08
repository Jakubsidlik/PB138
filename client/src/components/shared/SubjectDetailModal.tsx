import React from 'react'
import { Subject, ManagedFile, Lesson } from '../../app/types'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Textarea } from '../ui/textarea'

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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={!!subject} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{subject.name}</DialogTitle>
        </DialogHeader>

        <div className="subject-detail-modal-body">
          <div className="subject-detail-info">
            <p><strong>Kód:</strong> {subject.code}</p>
            <p><strong>Učitel:</strong> {subject.teacher}</p>
          </div>

          <div className="subject-detail-section">
            <h3>📄 Soubory ({subjectFiles.length})</h3>
            {subjectFiles.length > 0 ? (
              <ul className="subject-files-list">
                {subjectFiles.map((file) => (
                  <li key={file.id} className="subject-file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{file.size}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Zatím žádné soubory</p>
            )}
            
            <div className="subject-detail-input-group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddFile}
                style={{ display: 'none' }}
              />
              <Button 
                type="button" 
                className="subject-detail-add-button"
                onClick={() => fileInputRef.current?.click()}
              >
                + Přidat soubor
              </Button>
            </div>
          </div>

          <div className="subject-detail-section">
            <h3>📝 Poznámky ({subjectLessons.length})</h3>
            
            <div className="subject-detail-input-group mt-4 flex gap-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Napište poznámku..."
                rows={3}
                className="resize-none"
              />
              <Button 
                type="button" 
                className="subject-detail-add-button"
                onClick={handleAddNote}
                disabled={!noteText.trim()}
              >
                Přidat poznámku
              </Button>
            </div>

            {subjectLessons.length > 0 ? (
              <ul className="subject-notes-list">
                {subjectLessons.map((lesson) => (
                  <li key={lesson.id} className="subject-note-item">
                    <p className="note-text">{lesson.content || lesson.title}</p>
                    <span className="note-date">
                      {new Date(lesson.createdAt!).toLocaleDateString('cs-CZ')} {new Date(lesson.createdAt!).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Zatím žádné poznámky</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

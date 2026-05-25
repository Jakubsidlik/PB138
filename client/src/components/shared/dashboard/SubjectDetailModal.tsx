import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Subject, ManagedFile, Lesson } from '../../../app/types'
import { Button } from '../../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog'
import { Textarea } from '../../ui/textarea'
import { Hash, User, FileText, Upload, Plus, MessageSquare, Paperclip, Clock, UserCircle2, ThumbsUp, ThumbsDown, Share, Download } from 'lucide-react'
import { useDashboard } from '../../../app/DashboardContext'
import { ShareFileModal } from '../files/ShareFileModal'
import { createNoteSchema, type CreateNoteFormData } from '../../../app/schemas'

type SubjectDetailModalProps = {
  subject: Subject | null
  files: ManagedFile[]
  lessons: Lesson[]
  onClose: () => void
  onAddNote?: (subjectId: number, note: string) => void
  onAddFile?: (subjectId: number, file: File) => void
  onRateLesson?: (lessonId: number, vote: 'LIKE' | 'DISLIKE' | null) => Promise<void>
  onRateFile?: (fileId: number, vote: 'LIKE' | 'DISLIKE' | null) => Promise<void>
}

export function SubjectDetailModal({ 
  subject, 
  files, 
  lessons,
  onClose,
  onAddNote,
  onAddFile,
  onRateLesson,
  onRateFile,
}: SubjectDetailModalProps) {
  const { toggleFileShared } = useDashboard()
  const noteForm = useForm<CreateNoteFormData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { text: '' },
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [shareFileId, setShareFileId] = React.useState<number | null>(null)

  if (!subject) {
    return null
  }

  const subjectFiles = files.filter((file) => file.subjectId === subject.id)
  const subjectLessons = lessons.filter((lesson) => lesson.subjectId === subject.id)

  const handleFileVote = (fileId: number, voteType: 'LIKE' | 'DISLIKE') => {
    const file = subjectFiles.find(f => f.id === fileId)
    if (!file || !onRateFile) return
    const newVote = file.userVote === voteType ? null : voteType
    void onRateFile(fileId, newVote)
  }

  const handleNoteVote = (noteId: number, voteType: 'LIKE' | 'DISLIKE') => {
    const lesson = subjectLessons.find(l => l.id === noteId)
    if (!lesson || !onRateLesson) return
    const newVote = lesson.userVote === voteType ? null : voteType
    void onRateLesson(noteId, newVote)
  }

  const handleAddNote = (data: CreateNoteFormData) => {
    if (!data.text.trim()) {
      return
    }

    onAddNote?.(subject.id, data.text)
    noteForm.reset()
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
      <DialogContent 
        className="max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden bg-background"
        style={{ maxWidth: '760px', width: '100%' }}
      >
        <DialogHeader className="px-6 py-5 border-b pr-12 bg-muted/10">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {subject.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Detaily předmětu {subject.name}</DialogDescription>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md shadow-sm">
              <Hash className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-foreground">{subject.code}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md shadow-sm">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{subject.teacher || 'Není zadáno'}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Files Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary" />
                Soubory
                <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-medium">
                  {subjectFiles.length}
                </span>
              </h3>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddFile}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5" />
                Přidat soubor
              </Button>
            </div>

            {subjectFiles.length > 0 ? (
              <div className="grid gap-2">
                {subjectFiles.map((file) => {
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden mr-4">
                        <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate" title={file.name}>{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{file.size}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Rating controls */}
                        <div className="flex items-center gap-0.5 bg-muted/30 px-1 py-1 rounded-full border">
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 rounded-full gap-1.5 ${
                              file.userVote === 'LIKE' ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-600' : 'text-muted-foreground hover:bg-muted'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFileVote(file.id, 'LIKE');
                            }}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${file.userVote === 'LIKE' ? 'fill-current' : ''}`} />
                            <span className="min-w-[8px] text-xs font-semibold">{file.likes ?? 0}</span>
                          </Button>
                          <div className="w-[1px] h-3 bg-border mx-0.5" />
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 rounded-full gap-1.5 ${
                              file.userVote === 'DISLIKE' ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-600' : 'text-muted-foreground hover:bg-muted'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFileVote(file.id, 'DISLIKE');
                            }}
                          >
                            <ThumbsDown className={`w-3.5 h-3.5 ${file.userVote === 'DISLIKE' ? 'fill-current' : ''}`} />
                            <span className="min-w-[8px] text-xs font-semibold">{file.dislikes ?? 0}</span>
                          </Button>
                        </div>

                        {/* Download control */}
                        {file.fileUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                            onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                            title="Stáhnout"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Share control */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                          onClick={() => setShareFileId(file.id)}
                          title="Sdílet soubor s konkrétním uživatelem"
                        >
                          <Share className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                <FileText className="w-10 h-10 mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium">Zatím žádné soubory</p>
                <p className="text-xs text-muted-foreground mt-1">Klikněte na "Přidat soubor" pro nahrání prvního dokumentu.</p>
              </div>
            )}
          </section>

          {/* Notes Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Poznámky
                <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-medium">
                  {subjectLessons.length}
                </span>
              </h3>
            </div>
            
            <div className="bg-card p-3 rounded-lg border shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-200">
              <Textarea
                {...noteForm.register('text')}
                placeholder="Napište rychlou poznámku k předmětu..."
                rows={2}
                className="resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent p-1 min-h-[60px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    noteForm.handleSubmit(handleAddNote)();
                  }
                }}
              />
              <div className="flex justify-end items-center mt-2 pt-2 border-t border-border/50">
                <Button 
                  type="button" 
                  size="sm"
                  className="gap-1.5 rounded-full px-4"
                  onClick={() => noteForm.handleSubmit(handleAddNote)()}
                  disabled={!noteForm.watch('text')?.trim() || noteForm.formState.isSubmitting}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Přidat
                </Button>
              </div>
              {noteForm.formState.errors.text && (
                <p className="text-sm font-medium text-destructive mt-2">{noteForm.formState.errors.text.message}</p>
              )}
            </div>

            {subjectLessons.length > 0 ? (
              <div className="space-y-3 mt-4">
                {subjectLessons.map((lesson) => {
                  return (
                    <div key={lesson.id} className="p-4 rounded-lg border bg-card shadow-sm relative group">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{lesson.content || lesson.title}</p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground font-medium">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                            <UserCircle2 className="w-3.5 h-3.5 text-primary/70" />
                            <span className="truncate max-w-[120px]">{lesson.authorFullName || 'Autor neznámý'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground/70" />
                            <span>
                              {(() => {
                                const d = new Date(lesson.createdAt!)
                                // Oprava posunu času z databáze o +2 hodiny (na lokální CZ čas)
                                d.setHours(d.getHours() + 2)
                                return `${d.toLocaleDateString('cs-CZ')} ${d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Rating controls */}
                        <div className="flex items-center gap-0.5 bg-muted/30 px-1 py-1 rounded-full border">
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 rounded-full gap-1.5 ${
                              lesson.userVote === 'LIKE' ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-600' : 'text-muted-foreground hover:bg-muted'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleNoteVote(lesson.id, 'LIKE');
                            }}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${lesson.userVote === 'LIKE' ? 'fill-current' : ''}`} />
                            <span className="min-w-[8px] text-xs font-bold">{lesson.likes ?? 0}</span>
                          </Button>
                          <div className="w-[1px] h-3 bg-border mx-0.5" />
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 rounded-full gap-1.5 ${
                              lesson.userVote === 'DISLIKE' ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-600' : 'text-muted-foreground hover:bg-muted'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleNoteVote(lesson.id, 'DISLIKE');
                            }}
                          >
                            <ThumbsDown className={`w-3.5 h-3.5 ${lesson.userVote === 'DISLIKE' ? 'fill-current' : ''}`} />
                            <span className="min-w-[8px] text-xs font-bold">{lesson.dislikes ?? 0}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium">Zatím žádné poznámky</p>
                <p className="text-xs text-muted-foreground mt-1">Uložte si sem důležité informace k předmětu.</p>
              </div>
            )}
          </section>
        </div>
      </DialogContent>

      {shareFileId && (() => {
        const targetFile = files.find(f => f.id === shareFileId)
        return (
          <ShareFileModal
            isOpen={!!shareFileId}
            onClose={() => setShareFileId(null)}
            onShare={async (email) => {
              await toggleFileShared(shareFileId, email)
            }}
            fileName={targetFile?.name || 'Soubor'}
          />
        )
      })()}
    </Dialog>
  )
}


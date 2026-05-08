import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { DesktopSubjectMeta, DesktopSubjectTone, Subject, ManagedFile, Lesson } from '../app/types'
import { SubjectDetailModal } from '../components/shared/SubjectDetailModal'
import { SubjectActionButtons } from '../components/shared/SubjectActionButtons'
import { SubjectGrid } from '../components/shared/SubjectGrid'

type DesktopSubject = Subject & {
  meta: DesktopSubjectMeta
  deadlineCount: number
}

type SubjectFilter = 'all' | 'active' | 'archived'

type DesktopStudyPlanProps = {
  desktopSubjects: DesktopSubject[]
  subjectFilter: SubjectFilter
  setSubjectFilter: React.Dispatch<React.SetStateAction<SubjectFilter>>
  onCreateSubject: (data: {name: string, teacher: string, code: string}) => void
  onEditSubject: (subjectId: number, data: {name: string, teacher: string, code: string}) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
  managedFiles: ManagedFile[]
  onUploadFiles: (files: FileList | File[] | null, options?: { subjectId?: number; lessonId?: number }) => Promise<void>
  lessons: Lesson[]
  onAddNote: (subjectId: number, note: string) => Promise<void>
}

export function DesktopStudyPlan({
  desktopSubjects,
  subjectFilter,
  setSubjectFilter,
  onCreateSubject,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
  managedFiles,
  onUploadFiles,
  lessons,
  onAddNote,
}: DesktopStudyPlanProps) {
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null)
  const selectedSubject = desktopSubjects.find(s => s.id === selectedSubjectId) || null

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', teacher: '', code: '' })

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [editSubjectData, setEditSubjectData] = useState({ name: '', teacher: '', code: '' })

  const editingSubject = desktopSubjects.find(s => s.id === editingSubjectId)

  useEffect(() => {
    if (editingSubject) {
      setEditSubjectData({ name: editingSubject.name, teacher: editingSubject.teacher, code: editingSubject.code })
    }
  }, [editingSubject])

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.name.trim() || !newSubject.teacher.trim() || !newSubject.code.trim()) return
    onCreateSubject(newSubject)
    setNewSubject({ name: '', teacher: '', code: '' })
    setIsAddSubjectOpen(false)
  }

  const handleEditSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSubjectId && editSubjectData.name.trim() && editSubjectData.teacher.trim() && editSubjectData.code.trim()) {
      onEditSubject(editingSubjectId, editSubjectData)
      setEditingSubjectId(null)
    }
  }

  const handleAddNote = (subjectId: number, note: string) => {
    void onAddNote(subjectId, note)
  }

  const handleAddFile = (subjectId: number, file: File) => {
    void onUploadFiles([file], { subjectId })
  }

  const getToneClasses = (tone: string) => {
    switch (tone) {
      case 'blue': return { strip: 'bg-blue-500', icon: 'bg-blue-500/10 text-blue-500' }
      case 'emerald': return { strip: 'bg-emerald-500', icon: 'bg-emerald-500/10 text-emerald-500' }
      case 'amber': return { strip: 'bg-amber-500', icon: 'bg-amber-500/10 text-amber-500' }
      case 'violet': return { strip: 'bg-violet-500', icon: 'bg-violet-500/10 text-violet-500' }
      default: return { strip: 'bg-slate-500', icon: 'bg-slate-500/10 text-slate-500' }
    }
  }

  return (
    <section className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10" id="desktop-study-plan">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Studijní plán</h2>
        <p className="text-muted-foreground">Přehled předmětů a jejich probíhajících úkolů</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          type="button"
          variant={subjectFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setSubjectFilter('all')}
        >
          Všechny
        </Button>
        <Button
          type="button"
          variant={subjectFilter === 'active' ? 'default' : 'outline'}
          onClick={() => setSubjectFilter('active')}
        >
          Aktivní
        </Button>
        <Button
          type="button"
          variant={subjectFilter === 'archived' ? 'default' : 'outline'}
          onClick={() => setSubjectFilter('archived')}
        >
          Archivované
        </Button>
      </div>

      <SubjectGrid
        subjects={desktopSubjects}
        gridClassName="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        renderSubjectCard={(subject) => {
          const tones = getToneClasses(subject.meta.tone)
          return (
            <article
              key={subject.id}
              className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all hover:border-primary/50 cursor-pointer flex flex-col group h-full"
              onClick={() => setSelectedSubjectId(subject.id)}
            >
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${tones.strip}`} />
              <div className="flex flex-col p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${tones.icon}`}>
                    {subject.meta.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-muted rounded-md text-muted-foreground uppercase tracking-wider">{subject.code}</span>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{subject.name}</h3>
                  <p className="text-sm text-muted-foreground">{subject.teacher}</p>
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-auto pb-5 border-b">
                  <span className="flex items-center gap-2"><span>📄</span> {subject.files} souborů</span>
                  <span className="flex items-center gap-2"><span>📝</span> {subject.notes} poznámek</span>
                  {subject.deadlineCount > 0 ? (
                    <span className="flex items-center gap-2 text-destructive font-medium"><span>⚠️</span> {subject.deadlineCount} termíny</span>
                  ) : (
                    <span className="flex items-center gap-2 text-emerald-500 font-medium"><span>✅</span> Hotovo</span>
                  )}
                </div>

                <div className="mt-4 flex justify-between items-center text-muted-foreground group-hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
                  <SubjectActionButtons
                    subjectId={subject.id}
                    isArchived={subject.archived}
                    className="flex gap-4 w-full"
                    onEditSubject={() => setEditingSubjectId(subject.id)}
                    onToggleArchiveSubject={onToggleArchiveSubject}
                    onDeleteSubject={onDeleteSubject}
                  />
                </div>
              </div>
            </article>
          )
        }}
      />

      <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="w-full mb-8 h-32 border-2 border-dashed bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-2 rounded-xl text-lg">
            <span className="text-3xl font-light">＋</span>
            <span>Zapsat další předmět</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSubject}>
            <DialogHeader>
              <DialogTitle>Nový předmět</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Název předmětu</label>
                <Input value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Vyučující</label>
                <Input value={newSubject.teacher} onChange={e => setNewSubject({...newSubject, teacher: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Kód předmětu (např. PB138)</label>
                <Input value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newSubject.name.trim() || !newSubject.teacher.trim() || !newSubject.code.trim()}>Zapsat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSubjectId} onOpenChange={(open) => !open && setEditingSubjectId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubject}>
            <DialogHeader>
              <DialogTitle>Upravit předmět</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Název předmětu</label>
                <Input value={editSubjectData.name} onChange={e => setEditSubjectData({...editSubjectData, name: e.target.value})} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Vyučující</label>
                <Input value={editSubjectData.teacher} onChange={e => setEditSubjectData({...editSubjectData, teacher: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Kód předmětu</label>
                <Input value={editSubjectData.code} onChange={e => setEditSubjectData({...editSubjectData, code: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!editSubjectData.name.trim() || !editSubjectData.teacher.trim() || !editSubjectData.code.trim()}>Uložit změny</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SubjectDetailModal 
        subject={selectedSubject}
        files={managedFiles}
        lessons={lessons}
        onClose={() => setSelectedSubjectId(null)}
        onAddNote={handleAddNote}
        onAddFile={handleAddFile}
      />
    </section>
  )
}



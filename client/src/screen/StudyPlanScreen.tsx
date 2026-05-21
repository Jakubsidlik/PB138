import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog'
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
import { DesktopSubjectMeta, Subject, ManagedFile, Lesson, StudyPlan, Tag } from '../app/types'
import { SubjectDetailModal } from '../components/shared/dashboard/SubjectDetailModal'
import { SubjectActionButtons } from '../components/shared/dashboard/SubjectActionButtons'
import { SubjectGrid } from '../components/shared/dashboard/SubjectGrid'
import { TagManagerModal } from '../components/shared/dashboard/TagManagerModal'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription, CardAction } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { toast } from 'sonner'

type DesktopSubject = Subject & {
  meta: DesktopSubjectMeta
  deadlineCount: number
}

type SubjectFilter = 'all' | 'active' | 'archived'

type DesktopStudyPlanProps = {
  desktopSubjects: DesktopSubject[]
  subjectFilter: SubjectFilter
  setSubjectFilter: React.Dispatch<React.SetStateAction<SubjectFilter>>
  onCreateSubject: (data: { name: string, teacher: string, code: string, tagIds?: number[] }) => void
  onEditSubject: (subjectId: number, data: { name: string, teacher: string, code: string, tagIds?: number[] }) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
  tags: Tag[]
  tagFilter: number | null
  setTagFilter: React.Dispatch<React.SetStateAction<number | null>>
  onCreateTag: (data: { name: string, color: string }) => Promise<any>
  onDeleteTag: (id: number) => Promise<any>
  managedFiles: ManagedFile[]
  onUploadFiles: (files: FileList | File[] | null, options?: { subjectId?: number }) => Promise<void>
  lessons: Lesson[]
  onAddNote: (subjectId: number, note: string) => Promise<void>
  studyPlans: StudyPlan[]
  activeStudyPlanId: number | null
  setActiveStudyPlanId: (id: number | null) => void
  onCreateStudyPlan: (data: { name: string, description?: string }) => void
  onEditStudyPlan: (studyPlanId: number, data: { name: string, description?: string }) => void
  onToggleArchiveStudyPlan: (studyPlanId: number) => void
  onDeleteStudyPlan: (studyPlanId: number) => void
  onShareStudyPlan?: (studyPlanId: number, email: string) => Promise<void>
}

export function DesktopStudyPlan({
  desktopSubjects,
  subjectFilter,
  setSubjectFilter,
  onCreateSubject,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
  tags,
  tagFilter,
  setTagFilter,
  onCreateTag,
  onDeleteTag,
  managedFiles,
  onUploadFiles,
  lessons,
  onAddNote,
  studyPlans,
  activeStudyPlanId,
  setActiveStudyPlanId,
  onCreateStudyPlan,
  onEditStudyPlan,
  onToggleArchiveStudyPlan,
  onDeleteStudyPlan,
  onShareStudyPlan,
}: DesktopStudyPlanProps) {
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null)
  const selectedSubject = desktopSubjects.find(s => s.id === selectedSubjectId) || null

  const [sharingPlanId, setSharingPlanId] = useState<number | null>(null)
  const [sharePlanEmail, setSharePlanEmail] = useState('')
  const [isSharingPlanSubmitting, setIsSharingPlanSubmitting] = useState(false)

  const [sharingSubjectId, setSharingSubjectId] = useState<number | null>(null)
  const [shareSubjectEmail, setShareSubjectEmail] = useState('')
  const [isSharingSubjectSubmitting, setIsSharingSubjectSubmitting] = useState(false)

  const handleShareSubject = (subjectId: number) => {
    setSharingSubjectId(subjectId)
  }

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [newPlan, setNewPlan] = useState({ name: '', description: '' })
  const [newSubject, setNewSubject] = useState({ name: '', teacher: '', code: '', tagIds: [] as number[] })
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'archived'>('active')

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null)
  const [planToDelete, setPlanToDelete] = useState<number | null>(null)
  const [editSubjectData, setEditSubjectData] = useState({ name: '', teacher: '', code: '', tagIds: [] as number[] })

  const editingSubject = desktopSubjects.find(s => s.id === editingSubjectId)

  useEffect(() => {
    if (editingSubject) {
      setEditSubjectData({ name: editingSubject.name, teacher: editingSubject.teacher, code: editingSubject.code, tagIds: editingSubject.tags?.map(t => t.id) || [] })
    }
  }, [editingSubject])

  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [editPlanData, setEditPlanData] = useState({ name: '', description: '' })

  const editingPlan = studyPlans.find(p => p.id === editingPlanId)

  useEffect(() => {
    if (editingPlan) {
      setEditPlanData({ name: editingPlan.name, description: editingPlan.description || '' })
    }
  }, [editingPlan])

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.name.trim() || !newSubject.teacher.trim() || !newSubject.code.trim()) return
    onCreateSubject(newSubject)
    setNewSubject({ name: '', teacher: '', code: '', tagIds: [] })
    setIsAddSubjectOpen(false)
  }

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlan.name.trim()) return
    onCreateStudyPlan(newPlan)
    setNewPlan({ name: '', description: '' })
    setIsAddPlanOpen(false)
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

  const activePlan = studyPlans.find(p => p.id === activeStudyPlanId)

  return (
    <>
      {!activeStudyPlanId ? (
        <section className="flex flex-col gap-6 w-full px-8 pt-6 pb-10" id="desktop-study-plan">
          <div className="flex flex-col gap-1 pl-2 md:pl-4">
            <h2 className="text-2xl font-bold tracking-tight">Moje Studijní Plány</h2>
            <p className="text-muted-foreground">Vyberte si studijní plán nebo vytvořte nový</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              type="button"
              variant={planFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setPlanFilter('all')}
            >
              Všechny
            </Button>
            <Button
              type="button"
              variant={planFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setPlanFilter('active')}
            >
              Aktivní
            </Button>
            <Button
              type="button"
              variant={planFilter === 'archived' ? 'default' : 'outline'}
              onClick={() => setPlanFilter('archived')}
            >
              Archivované
            </Button>
            <div className="ml-auto">
              <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
                <DialogTrigger render={<Button size="lg" className="h-10 px-5 text-sm font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--text-contrast)] shadow-sm" />}>
                  + Nový studijní plán
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleCreatePlan}>
                    <DialogHeader>
                      <DialogTitle>Nový studijní plán</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Název plánu</label>
                        <Input value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} autoFocus />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Popis</label>
                        <Input value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={!newPlan.name.trim()}>Vytvořit</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {studyPlans.filter(plan => {
              if (planFilter === 'all') return true
              if (planFilter === 'active') return plan.isActive
              if (planFilter === 'archived') return !plan.isActive
              return true
            }).map((plan) => (
              <Card
                key={plan.id}
                className="relative overflow-hidden hover:shadow-md transition-all hover:border-primary/50 cursor-pointer flex flex-col group h-full"
                onClick={() => setActiveStudyPlanId(plan.id)}
              >
                <span className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-primary/10 text-primary">
                      📁
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="mb-4">
                    <CardTitle className="group-hover:text-primary transition-colors mb-1 line-clamp-1">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                      {plan.description || 'Bez popisu'}
                    </CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground mt-auto">
                    <span>📚 {plan.subjectsCount || 0} předmětů</span>
                  </div>
                </CardContent>

                <Separator />

                <CardFooter className="py-2 px-4 bg-muted/30">
                  <SubjectActionButtons
                    subjectId={plan.id}
                    isArchived={!plan.isActive}
                    className="w-full"
                    onEditSubject={(id) => setEditingPlanId(id)}
                    onToggleArchiveSubject={onToggleArchiveStudyPlan}
                    onDeleteSubject={() => setPlanToDelete(plan.id)}
                    onShare={(id) => setSharingPlanId(id)}
                  />
                </CardFooter>
              </Card>
            ))}

            <Dialog open={!!editingPlanId} onOpenChange={(open) => !open && setEditingPlanId(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (editingPlanId && editPlanData.name.trim()) {
                    onEditStudyPlan(editingPlanId, editPlanData)
                    setEditingPlanId(null)
                  }
                }}>
                  <DialogHeader>
                    <DialogTitle>Upravit studijní plán</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Název plánu</label>
                      <Input value={editPlanData.name} onChange={e => setEditPlanData({ ...editPlanData, name: e.target.value })} autoFocus />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Popis</label>
                      <Input value={editPlanData.description} onChange={e => setEditPlanData({ ...editPlanData, description: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!editPlanData.name.trim()}>Uložit změny</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-6 w-full px-8 pt-6 pb-10" id="desktop-study-plan">
          <div className="flex flex-col gap-1 pl-2 md:pl-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <button onClick={() => setActiveStudyPlanId(null)} className="hover:text-foreground transition-colors">← Zpět na plány</button>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{activePlan?.name || 'Studijní plán'}</h2>
            <p className="text-muted-foreground">Přehled předmětů v tomto plánu</p>
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
            
            <div className="ml-2 w-40">
              <Select
                value={tagFilter ? tagFilter.toString() : 'all'}
                onValueChange={(val) => setTagFilter(val === 'all' ? null : parseInt(val || '0'))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filtrovat podle štítku" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny štítky</SelectItem>
                  {tags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>{tag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto">
              <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                <DialogTrigger render={<Button size="lg" className="h-10 px-5 text-sm font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--text-contrast)] shadow-sm mr-2" />}>
                  + Zapsat předmět
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleCreateSubject}>
                    <DialogHeader>
                      <DialogTitle>Nový předmět</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Název předmětu</label>
                        <Input value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} autoFocus />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Vyučující</label>
                        <Input value={newSubject.teacher} onChange={e => setNewSubject({ ...newSubject, teacher: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Kód předmětu (např. PB138)</label>
                        <Input value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Štítky</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tags.map(tag => {
                            const isSelected = newSubject.tagIds.includes(tag.id)
                            return (
                              <Badge
                                key={tag.id}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  setNewSubject(prev => ({
                                    ...prev,
                                    tagIds: isSelected ? prev.tagIds.filter(id => id !== tag.id) : [...prev.tagIds, tag.id]
                                  }))
                                }}
                              >
                                {tag.name}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={!newSubject.name.trim() || !newSubject.teacher.trim() || !newSubject.code.trim()}>Zapsat</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <TagManagerModal
                tags={tags}
                onCreateTag={onCreateTag}
                onDeleteTag={onDeleteTag}
              />
            </div>
          </div>

          <SubjectGrid
            subjects={desktopSubjects}
            gridClassName="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            renderSubjectCard={(subject) => {
              const tones = getToneClasses(subject.meta.tone)
              return (
                <Card
                  key={subject.id}
                  className="relative overflow-hidden hover:shadow-md transition-all hover:border-primary/50 cursor-pointer flex flex-col group h-full"
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  <span className={`absolute top-0 left-0 right-0 h-1 ${tones.strip}`} />

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${tones.icon}`}>
                        {subject.meta.icon}
                      </div>
                      <CardAction>
                        <Badge variant="secondary" className="font-bold tracking-wider">
                          {subject.code}
                        </Badge>
                      </CardAction>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="mb-4">
                      <CardTitle className="group-hover:text-primary transition-colors mb-1 line-clamp-1">
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {subject.teacher}
                      </CardDescription>
                      {subject.tags && subject.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {subject.tags.map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-[10px] h-5 px-1.5 leading-none">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 text-sm text-muted-foreground mt-auto pb-4">
                      <span className="flex items-center gap-2">
                        <span className="opacity-70">📄</span> {subject.files} souborů
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="opacity-70">📝</span> {subject.notes} poznámek
                      </span>
                    </div>
                  </CardContent>

                  <Separator />

                  <CardFooter className="py-2 px-4 bg-muted/30">
                    <SubjectActionButtons
                      subjectId={subject.id}
                      isArchived={subject.archived}
                      className="w-full"
                      onEditSubject={() => setEditingSubjectId(subject.id)}
                      onToggleArchiveSubject={onToggleArchiveSubject}
                      onDeleteSubject={() => setSubjectToDelete(subject.id)}
                      onShare={handleShareSubject}
                    />
                  </CardFooter>
                </Card>
              )
            }}
          />

          <Dialog open={!!editingSubjectId} onOpenChange={(open) => !open && setEditingSubjectId(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleEditSubject}>
                <DialogHeader>
                  <DialogTitle>Upravit předmět</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Název předmětu</label>
                    <Input value={editSubjectData.name} onChange={e => setEditSubjectData({ ...editSubjectData, name: e.target.value })} autoFocus />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Vyučující</label>
                    <Input value={editSubjectData.teacher} onChange={e => setEditSubjectData({ ...editSubjectData, teacher: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Kód předmětu</label>
                    <Input value={editSubjectData.code} onChange={e => setEditSubjectData({ ...editSubjectData, code: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Štítky</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tags.map(tag => {
                        const isSelected = editSubjectData.tagIds.includes(tag.id)
                        return (
                          <Badge
                            key={tag.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setEditSubjectData(prev => ({
                                ...prev,
                                tagIds: isSelected ? prev.tagIds.filter(id => id !== tag.id) : [...prev.tagIds, tag.id]
                              }))
                            }}
                          >
                            {tag.name}
                          </Badge>
                        )
                      })}
                    </div>
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
      )}

      {/* Alert Dialog for Subject Deletion */}
      <AlertDialog open={subjectToDelete !== null} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat tento předmět?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná a předmět bude trvale smazán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (subjectToDelete) onDeleteSubject(subjectToDelete)
              setSubjectToDelete(null)
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for Study Plan Deletion */}
      <AlertDialog open={planToDelete !== null} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu chcete smazat tento studijní plán?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná a studijní plán bude trvale smazán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (planToDelete) onDeleteStudyPlan(planToDelete)
              setPlanToDelete(null)
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Study Plan Dialog */}
      <Dialog open={sharingPlanId !== null} onOpenChange={(open) => !open && setSharingPlanId(null)}>
        <DialogContent 
          style={{ maxWidth: '425px', width: '100%' }}
        >
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!sharingPlanId || !sharePlanEmail.trim()) return
            setIsSharingPlanSubmitting(true)
            try {
              await onShareStudyPlan?.(sharingPlanId, sharePlanEmail.trim())
              setSharingPlanId(null)
              setSharePlanEmail('')
            } catch (err: any) {
              toast.error(err.message || 'Nepodařilo se nasdílet studijní plán.')
            } finally {
              setIsSharingPlanSubmitting(false)
            }
          }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Sdílet studijní plán</DialogTitle>
              <DialogDescription>
                Zadejte e-mailovou adresu uživatele, se kterým chcete sdílet studijní plán <strong>{studyPlans.find(p => p.id === sharingPlanId)?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">E-mail uživatele</label>
              <Input
                type="email"
                placeholder="např. spolužák@skola.cz"
                value={sharePlanEmail}
                onChange={(e) => setSharePlanEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isSharingPlanSubmitting || !sharePlanEmail.trim()} className="w-full">
                {isSharingPlanSubmitting ? 'Sdílím...' : 'Sdílet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Subject Dialog */}
      <Dialog open={sharingSubjectId !== null} onOpenChange={(open) => !open && setSharingSubjectId(null)}>
        <DialogContent 
          style={{ maxWidth: '425px', width: '100%' }}
        >
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!sharingSubjectId || !shareSubjectEmail.trim()) return
            setIsSharingSubjectSubmitting(true)
            try {
              const subject = desktopSubjects.find(s => s.id === sharingSubjectId)
              if (!subject) return
              
              if (subject.studyPlanId) {
                await onShareStudyPlan?.(subject.studyPlanId, shareSubjectEmail.trim())
              }
              toast.success(`Předmět ${subject.name} byl úspěšně nasdílen uživateli ${shareSubjectEmail}`)
              setSharingSubjectId(null)
              setShareSubjectEmail('')
            } catch (err: any) {
              toast.error(err.message || 'Nepodařilo se nasdílet předmět.')
            } finally {
              setIsSharingSubjectSubmitting(false)
            }
          }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Sdílet předmět</DialogTitle>
              <DialogDescription>
                Zadejte e-mailovou adresu uživatele, se kterým chcete sdílet předmět <strong>{desktopSubjects.find(s => s.id === sharingSubjectId)?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">E-mail uživatele</label>
              <Input
                type="email"
                placeholder="např. jan.novak@skola.cz"
                value={shareSubjectEmail}
                onChange={(e) => setShareSubjectEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={isSharingSubjectSubmitting || !shareSubjectEmail.trim()} className="w-full">
                {isSharingSubjectSubmitting ? 'Sdílím...' : 'Sdílet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}



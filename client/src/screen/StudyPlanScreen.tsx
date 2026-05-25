import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { createStudyPlanSchema, editStudyPlanSchema, createSubjectSchema, editSubjectSchema, shareStudyPlanSchema, shareSubjectSchema, type CreateStudyPlanFormData, type EditStudyPlanFormData, type CreateSubjectFormData, type EditSubjectFormData, type ShareStudyPlanFormData, type ShareSubjectFormData } from '../app/schemas'
import { useDashboard } from '../app/DashboardContext'

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
  onEditSubject: (subjectId: number, data: { name: string, teacher: string, code: string, tagIds?: number[], studyPlanId?: number | null }) => void
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
  onDeleteNote?: (noteId: number) => Promise<void>
  onUpdateNote?: (noteId: number, note: string) => Promise<void>
  studyPlans: StudyPlan[]
  activeStudyPlanId: number | null
  setActiveStudyPlanId: (id: number | null) => void
  onCreateStudyPlan: (data: { name: string, description?: string }) => void
  onEditStudyPlan: (studyPlanId: number, data: { name: string, description?: string }) => void
  onToggleArchiveStudyPlan: (studyPlanId: number) => void
  onDeleteStudyPlan: (studyPlanId: number) => void
  onShareStudyPlan?: (studyPlanId: number, email: string) => Promise<void>
  onShareSubject?: (subjectId: number, email: string) => Promise<void>
  onRateLesson?: (lessonId: number, vote: 'LIKE' | 'DISLIKE' | null) => Promise<void>
  onRateFile?: (fileId: number, vote: 'LIKE' | 'DISLIKE' | null) => Promise<void>
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
  onDeleteNote,
  onUpdateNote,
  studyPlans,
  activeStudyPlanId,
  setActiveStudyPlanId,
  onCreateStudyPlan,
  onEditStudyPlan,
  onToggleArchiveStudyPlan,
  onDeleteStudyPlan,
  onShareStudyPlan,
  onShareSubject,
  onRateLesson,
  onRateFile,
}: DesktopStudyPlanProps) {
  const { authSession } = useDashboard()
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null)
  const selectedSubject = desktopSubjects.find(s => s.id === selectedSubjectId) || null

  const unassignedSubjectsCount = React.useMemo(
    () => desktopSubjects.filter((s) => s.studyPlanId === null || s.studyPlanId === undefined).length,
    [desktopSubjects],
  )

  // Study Plan forms
  const createPlanForm = useForm<CreateStudyPlanFormData>({
    resolver: zodResolver(createStudyPlanSchema),
    defaultValues: { name: '', description: '' },
  })

  const editPlanForm = useForm<EditStudyPlanFormData>({
    resolver: zodResolver(editStudyPlanSchema),
    defaultValues: { name: '', description: '' },
  })

  const sharePlanForm = useForm<ShareStudyPlanFormData>({
    resolver: zodResolver(shareStudyPlanSchema),
    defaultValues: { email: '' },
  })

  // Subject forms
  const createSubjectForm = useForm<CreateSubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', teacher: '', code: '', tagIds: [] },
  })

  const editSubjectForm = useForm<EditSubjectFormData>({
    resolver: zodResolver(editSubjectSchema),
    defaultValues: { name: '', teacher: '', code: '', tagIds: [] },
  })

  const shareSubjectForm = useForm<ShareSubjectFormData>({
    resolver: zodResolver(shareSubjectSchema),
    defaultValues: { email: '' },
  })

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [planFilter, setPlanFilter] = useState<'all' | 'active' | 'archived'>('active')

  const [sharingPlanId, setSharingPlanId] = useState<number | null>(null)
  const [sharingSubjectId, setSharingSubjectId] = useState<number | null>(null)

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null)
  const [planToDelete, setPlanToDelete] = useState<number | null>(null)

  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)

  const editingSubject = desktopSubjects.find(s => s.id === editingSubjectId)
  const editingPlan = studyPlans.find(p => p.id === editingPlanId)

  useEffect(() => {
    if (editingSubject) {
      editSubjectForm.reset({
        name: editingSubject.name,
        teacher: editingSubject.teacher,
        code: editingSubject.code,
        tagIds: editingSubject.tags?.map(t => t.id) || [],
        studyPlanId: editingSubject.studyPlanId,
      })
    }
  }, [editingSubject, editSubjectForm])

  useEffect(() => {
    if (editingPlan) {
      editPlanForm.reset({
        name: editingPlan.name,
        description: editingPlan.description || '',
      })
    }
  }, [editingPlan, editPlanForm])

  useEffect(() => {
    if (sharingPlanId) {
      sharePlanForm.reset({ email: '' })
    }
  }, [sharingPlanId, sharePlanForm])

  useEffect(() => {
    if (sharingSubjectId) {
      shareSubjectForm.reset({ email: '' })
    }
  }, [sharingSubjectId, shareSubjectForm])

  const handleCreatePlan = async (data: CreateStudyPlanFormData) => {
    onCreateStudyPlan(data)
    createPlanForm.reset()
    setIsAddPlanOpen(false)
  }

  const handleCreateSubject = async (data: CreateSubjectFormData) => {
    onCreateSubject(data)
    createSubjectForm.reset()
    setIsAddSubjectOpen(false)
  }

  const handleEditSubject = async (data: EditSubjectFormData) => {
    if (editingSubjectId) {
      onEditSubject(editingSubjectId, data)
      setEditingSubjectId(null)
    }
  }

  const handleEditPlan = async (data: EditStudyPlanFormData) => {
    if (editingPlanId) {
      onEditStudyPlan(editingPlanId, data)
      setEditingPlanId(null)
    }
  }

  const handleSharePlan = async (data: ShareStudyPlanFormData) => {
    if (sharingPlanId) {
      try {
        await onShareStudyPlan?.(sharingPlanId, data.email)
        setSharingPlanId(null)
      } catch (err: any) {
        toast.error(err.message || 'Nepodařilo se nasdílet studijní plán.')
      }
    }
  }

  const handleShareSubject = async (data: ShareSubjectFormData) => {
    if (sharingSubjectId) {
      try {
        await onShareSubject?.(sharingSubjectId, data.email)
        setSharingSubjectId(null)
      } catch (err: any) {
        toast.error(err.message || 'Nepodařilo se nasdílet předmět.')
      }
    }
  }

  const handleAddNote = (subjectId: number, note: string) => {
    void onAddNote(subjectId, note)
  }

  const handleAddFile = (subjectId: number, file: File) => {
    void onUploadFiles([file], { subjectId })
  }

  const openSharePlan = (planId: number) => {
    setSharingPlanId(planId)
  }

  const openShareSubject = (subjectId: number) => {
    setSharingSubjectId(subjectId)
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
                  <form onSubmit={createPlanForm.handleSubmit(handleCreatePlan)}>
                    <DialogHeader>
                      <DialogTitle>Nový studijní plán</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Název plánu</label>
                        <Input {...createPlanForm.register('name')} autoFocus />
                        {createPlanForm.formState.errors.name && (
                          <p className="text-sm font-medium text-destructive">{createPlanForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Popis</label>
                        <Input {...createPlanForm.register('description')} />
                        {createPlanForm.formState.errors.description && (
                          <p className="text-sm font-medium text-destructive">{createPlanForm.formState.errors.description.message}</p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createPlanForm.formState.isSubmitting}>Vytvořit</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(planFilter === 'active' || planFilter === 'all') && (
              <Card
                className="relative overflow-hidden hover:shadow-md transition-all hover:border-primary/50 cursor-pointer flex flex-col group h-full border-dashed border-2 bg-muted/10"
                onClick={() => setActiveStudyPlanId(-1)}
              >
                <span className="absolute top-0 left-0 right-0 h-1 bg-muted-foreground/30" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-muted/20 text-muted-foreground">
                      📂
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="mb-4">
                    <CardTitle className="group-hover:text-primary transition-colors mb-1 line-clamp-1">
                      Nezařazené předměty
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                      Předměty, které nemají přiřazený studijní plán nebo byly nasdíleny.
                    </CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground mt-auto">
                    <span>📚 {unassignedSubjectsCount} předmětů</span>
                  </div>
                </CardContent>
              </Card>
            )}
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
                    {plan.userId !== undefined && plan.userId !== null && plan.userId !== Number(authSession?.userId) && (
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Sdílené
                      </span>
                    )}
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
                    onShare={openSharePlan}
                    isOwner={plan.userId === Number(authSession?.userId) || authSession?.role === 'ADMIN'}
                  />
                </CardFooter>
              </Card>
            ))}

            <Dialog open={!!editingPlanId} onOpenChange={(open) => !open && setEditingPlanId(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={editPlanForm.handleSubmit(handleEditPlan)}>
                  <DialogHeader>
                    <DialogTitle>Upravit studijní plán</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Název plánu</label>
                      <Input {...editPlanForm.register('name')} autoFocus />
                      {editPlanForm.formState.errors.name && (
                        <p className="text-sm font-medium text-destructive">{editPlanForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Popis</label>
                      <Input {...editPlanForm.register('description')} />
                      {editPlanForm.formState.errors.description && (
                        <p className="text-sm font-medium text-destructive">{editPlanForm.formState.errors.description.message}</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={editPlanForm.formState.isSubmitting}>Uložit změny</Button>
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
            <h2 className="text-2xl font-bold tracking-tight">
              {activeStudyPlanId === -1 ? 'Nezařazené předměty' : (activePlan?.name || 'Studijní plán')}
            </h2>
            <p className="text-muted-foreground">
              {activeStudyPlanId === -1 ? 'Přehled předmětů bez studijního plánu' : 'Přehled předmětů v tomto plánu'}
            </p>
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
                  <form onSubmit={createSubjectForm.handleSubmit(handleCreateSubject)}>
                    <DialogHeader>
                      <DialogTitle>Nový předmět</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Název předmětu</label>
                        <Input {...createSubjectForm.register('name')} autoFocus />
                        {createSubjectForm.formState.errors.name && (
                          <p className="text-sm font-medium text-destructive">{createSubjectForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Vyučující</label>
                        <Input {...createSubjectForm.register('teacher')} />
                        {createSubjectForm.formState.errors.teacher && (
                          <p className="text-sm font-medium text-destructive">{createSubjectForm.formState.errors.teacher.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Kód předmětu (např. PB138)</label>
                        <Input {...createSubjectForm.register('code')} />
                        {createSubjectForm.formState.errors.code && (
                          <p className="text-sm font-medium text-destructive">{createSubjectForm.formState.errors.code.message}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Štítky</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tags.map(tag => {
                            const isSelected = createSubjectForm.watch('tagIds')?.includes(tag.id) || false
                            return (
                              <Badge
                                key={tag.id}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const current = createSubjectForm.watch('tagIds') || []
                                  createSubjectForm.setValue('tagIds', isSelected ? current.filter(id => id !== tag.id) : [...current, tag.id])
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
                      <Button type="submit" disabled={createSubjectForm.formState.isSubmitting}>Zapsat</Button>
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
                      <CardAction className="flex items-center gap-2">
                        {(subject.studyPlanId === null || subject.studyPlanId === undefined) &&
                          subject.userId !== undefined && subject.userId !== null && subject.userId !== Number(authSession?.userId) && (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              Sdílené
                            </span>
                          )}
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
                      onShare={openShareSubject}
                      isOwner={subject.userId === Number(authSession?.userId) || authSession?.role === 'ADMIN'}
                    />
                  </CardFooter>
                </Card>
              )
            }}
          />

          <Dialog open={!!editingSubjectId} onOpenChange={(open) => !open && setEditingSubjectId(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={editSubjectForm.handleSubmit(handleEditSubject)}>
                <DialogHeader>
                  <DialogTitle>Upravit předmět</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Název předmětu</label>
                    <Input {...editSubjectForm.register('name')} autoFocus />
                    {editSubjectForm.formState.errors.name && (
                      <p className="text-sm font-medium text-destructive">{editSubjectForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Vyučující</label>
                    <Input {...editSubjectForm.register('teacher')} />
                    {editSubjectForm.formState.errors.teacher && (
                      <p className="text-sm font-medium text-destructive">{editSubjectForm.formState.errors.teacher.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Kód předmětu</label>
                    <Input {...editSubjectForm.register('code')} />
                    {editSubjectForm.formState.errors.code && (
                      <p className="text-sm font-medium text-destructive">{editSubjectForm.formState.errors.code.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Studijní plán</label>
                    <Select
                      value={editSubjectForm.watch('studyPlanId') !== undefined && editSubjectForm.watch('studyPlanId') !== null ? (editSubjectForm.watch('studyPlanId')?.toString() || 'none') : 'none'}
                      onValueChange={(val) => editSubjectForm.setValue('studyPlanId', (val === 'none' || !val ? null : parseInt(val)) as any)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Vyberte studijní plán" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Bez studijního plánu (Nezařazené)</SelectItem>
                        {studyPlans.filter(p => p.isActive).map(plan => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Štítky</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tags.map(tag => {
                        const isSelected = editSubjectForm.watch('tagIds')?.includes(tag.id) || false
                        return (
                          <Badge
                            key={tag.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = editSubjectForm.watch('tagIds') || []
                              editSubjectForm.setValue('tagIds', isSelected ? current.filter(id => id !== tag.id) : [...current, tag.id])
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
                  <Button type="submit" disabled={editSubjectForm.formState.isSubmitting}>Uložit změny</Button>
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
            onRateLesson={onRateLesson}
            onRateFile={onRateFile}
            onDeleteNote={onDeleteNote}
            onUpdateNote={onUpdateNote}
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
          <form onSubmit={sharePlanForm.handleSubmit(handleSharePlan)} className="space-y-4">
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
                {...sharePlanForm.register('email')}
                autoFocus
              />
              {sharePlanForm.formState.errors.email && (
                <p className="text-sm font-medium text-destructive">{sharePlanForm.formState.errors.email.message}</p>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={sharePlanForm.formState.isSubmitting} className="w-full">
                {sharePlanForm.formState.isSubmitting ? 'Sdílím...' : 'Sdílet'}
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
          <form onSubmit={shareSubjectForm.handleSubmit(handleShareSubject)} className="space-y-4">
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
                {...shareSubjectForm.register('email')}
                autoFocus
              />
              {shareSubjectForm.formState.errors.email && (
                <p className="text-sm font-medium text-destructive">{shareSubjectForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={shareSubjectForm.formState.isSubmitting} className="w-full">
                {shareSubjectForm.formState.isSubmitting ? 'Sdílím...' : 'Sdílet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}



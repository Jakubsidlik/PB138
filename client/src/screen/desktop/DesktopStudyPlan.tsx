import React from 'react'
import { Button } from '../../components/ui/button'
import { DesktopSubjectMeta, DesktopSubjectTone, Subject, ManagedFile, Lesson } from '../../app/types'
import { SubjectDetailModal } from '../../components/shared/SubjectDetailModal'

type DesktopSubject = Subject & {
  meta: DesktopSubjectMeta
  deadlineCount: number
}

type SubjectFilter = 'all' | 'active' | 'archived'

type DesktopStudyPlanProps = {
  desktopSubjects: DesktopSubject[]
  subjectFilter: SubjectFilter
  setSubjectFilter: React.Dispatch<React.SetStateAction<SubjectFilter>>
  onCreateSubject: () => void
  onEditSubject: (subjectId: number) => void
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

  const handleAddNote = (subjectId: number, note: string) => {
    void onAddNote(subjectId, note)
  }

  const handleAddFile = (subjectId: number, file: File) => {
    void onUploadFiles([file], { subjectId })
  }

  return (
    <section className="desktop-study-plan" id="desktop-study-plan">
      <div className="desktop-study-plan-head">
        <h2>Studijní plán</h2>
        <p>Přehled předmětů a jejich probíhajících úkolů</p>
      </div>

      <div className="desktop-subjects-filters">
        <Button
          type="button"
          className={subjectFilter === 'all' ? 'active' : ''}
          onClick={() => setSubjectFilter('all')}
        >
          Všechny
        </Button>
        <Button
          type="button"
          className={subjectFilter === 'active' ? 'active' : ''}
          onClick={() => setSubjectFilter('active')}
        >
          Aktivní
        </Button>
        <Button
          type="button"
          className={subjectFilter === 'archived' ? 'active' : ''}
          onClick={() => setSubjectFilter('archived')}
        >
          Archivované
        </Button>
      </div>

      <div className="desktop-subjects-grid">
        {desktopSubjects.map((subject) => (
          <article 
            key={subject.id} 
            className="desktop-subject-card"
            onClick={() => setSelectedSubjectId(subject.id)}
          >
            <span className={`subject-strip ${subject.meta.tone}`} />
            <div className="desktop-subject-card-body">
              <div className="desktop-subject-card-top">
                <div className={`desktop-subject-icon ${subject.meta.tone as DesktopSubjectTone}`}>
                  {subject.meta.icon}
                </div>
                <span className="desktop-subject-code">{subject.code}</span>
              </div>

              <h3>{subject.name}</h3>
              <p>{subject.teacher}</p>

              <div className="desktop-subject-stats">
                <span>📄 {subject.files} souborů</span>
                <span>📝 {subject.notes} poznámek</span>
                {subject.deadlineCount > 0 ? (
                  <span className="warning">⚠️ {subject.deadlineCount} termíny</span>
                ) : (
                  <span className="ok">✅ Hotovo</span>
                )}
              </div>

              <div className="desktop-files-tabs" onClick={(e) => e.stopPropagation()}>
                <Button type="button" onClick={() => onEditSubject(subject.id)}>
                  Upravit
                </Button>
                {subject.archived ? (
                  <Button type="button" onClick={() => onToggleArchiveSubject(subject.id)}>
                    Obnovit
                  </Button>
                ) : (
                  <Button type="button" onClick={() => onToggleArchiveSubject(subject.id)}>
                    Archivovat
                  </Button>
                )}
                <Button type="button" onClick={() => onDeleteSubject(subject.id)}>
                  Smazat
                </Button>
              </div>
            </div>
          </article>
        ))}

        <Button type="button" className="desktop-subject-add-card" onClick={onCreateSubject}>
          <div>＋</div>
          <span>Zapsat další předmět</span>
        </Button>
      </div>

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



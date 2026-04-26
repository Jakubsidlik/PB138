import React from 'react'
import { DesktopSubjectMeta, DesktopSubjectTone, Subject } from '../../app/types'

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
}

export function DesktopStudyPlan({
  desktopSubjects,
  subjectFilter,
  setSubjectFilter,
  onCreateSubject,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
}: DesktopStudyPlanProps) {
  return (
    <section className="desktop-study-plan" id="desktop-study-plan">
      <div className="desktop-study-plan-head">
        <h2>Studijní plán</h2>
        <p>Přehled předmětů a jejich probíhajících úkolů</p>
      </div>

      <div className="desktop-subjects-filters">
        <button
          type="button"
          className={subjectFilter === 'all' ? 'active' : ''}
          onClick={() => setSubjectFilter('all')}
        >
          Všechny
        </button>
        <button
          type="button"
          className={subjectFilter === 'active' ? 'active' : ''}
          onClick={() => setSubjectFilter('active')}
        >
          Aktivní
        </button>
        <button
          type="button"
          className={subjectFilter === 'archived' ? 'active' : ''}
          onClick={() => setSubjectFilter('archived')}
        >
          Archivované
        </button>
      </div>

      <div className="desktop-subjects-grid">
        {desktopSubjects.map((subject) => (
          <article key={subject.id} className="desktop-subject-card">
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

              <div className="desktop-files-tabs">
                <button type="button" onClick={() => onEditSubject(subject.id)}>
                  Upravit
                </button>
                <button type="button" onClick={() => onToggleArchiveSubject(subject.id)}>
                  {subject.archived ? 'Obnovit' : 'Archivovat'}
                </button>
                <button type="button" onClick={() => onDeleteSubject(subject.id)}>
                  Smazat
                </button>
              </div>
            </div>
          </article>
        ))}

        <button type="button" className="desktop-subject-add-card" onClick={onCreateSubject}>
          <div>＋</div>
          <span>Zapsat další předmět</span>
        </button>
      </div>
    </section>
  )
}

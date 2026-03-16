import React from 'react'
import { Subject, SubjectVisual } from '../../app/types'

type MobileSubjectsScreenProps = {
  subjectSearch: string
  setSubjectSearch: React.Dispatch<React.SetStateAction<string>>
  filteredSubjects: Subject[]
  subjectVisualByCode: Record<string, SubjectVisual>
  onCreateSubject: () => void
  onEditSubject: (subjectId: number) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
}

export function MobileSubjectsScreen({
  subjectSearch,
  setSubjectSearch,
  filteredSubjects,
  subjectVisualByCode,
  onCreateSubject,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
}: MobileSubjectsScreenProps) {
  return (
    <section className="mobile-subjects-screen" id="subjects-mobile">
      <div className="subjects-search-wrap">
        <label className="subjects-search">
          <span aria-hidden="true">🔎</span>
          <input
            type="text"
            value={subjectSearch}
            onChange={(event) => setSubjectSearch(event.target.value)}
            placeholder="Hledat předměty..."
          />
        </label>
      </div>

      <div className="subjects-mobile-grid">
        {filteredSubjects.map((subject) => {
          const visual = subjectVisualByCode[subject.code] ?? {
            icon: '📘',
            tone: 'amber' as const,
          }

          return (
            <article key={subject.id} className="subject-mobile-card">
              <div className={`subject-mobile-visual ${visual.tone}`}>{visual.icon}</div>
              <h3>{subject.name}</h3>
              <div className="subject-mobile-meta">
                <p>📄 {subject.files} souborů</p>
                <p>📝 {subject.notes} poznámek</p>
              </div>
              <div className="desktop-files-tabs">
                <button type="button" onClick={() => onEditSubject(subject.id)}>Upravit</button>
                <button type="button" onClick={() => onToggleArchiveSubject(subject.id)}>
                  {subject.archived ? 'Obnovit' : 'Archivovat'}
                </button>
                <button type="button" onClick={() => onDeleteSubject(subject.id)}>Smazat</button>
              </div>
            </article>
          )
        })}
      </div>

      {filteredSubjects.length === 0 ? (
        <p className="subjects-empty">Nenalezeny žádné předměty.</p>
      ) : null}

      <button type="button" className="subjects-fab" aria-label="Přidat předmět" onClick={onCreateSubject}>
        +
      </button>
    </section>
  )
}

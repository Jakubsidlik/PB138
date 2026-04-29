
import React from 'react'
import { Subject, SubjectVisual, ManagedFile } from '../../app/types'
import { SubjectDetailModal } from '../../components/shared/SubjectDetailModal'

type MobileStudyPlanScreenProps = {
    subjectSearch: string
    setSubjectSearch: React.Dispatch<React.SetStateAction<string>>
    filteredSubjects: Subject[]
    subjectVisualByCode: Record<string, SubjectVisual>
    onCreateSubject: () => void
    onEditSubject: (subjectId: number) => void
    onToggleArchiveSubject: (subjectId: number) => void
    onDeleteSubject: (subjectId: number) => void
    managedFiles: ManagedFile[]
}

export function MobileStudyPlanScreen({
    subjectSearch,
    setSubjectSearch,
    filteredSubjects,
    subjectVisualByCode,
    onCreateSubject,
    onEditSubject,
    onToggleArchiveSubject,
    onDeleteSubject,
    managedFiles,
}: MobileStudyPlanScreenProps) {
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null)
    const selectedSubject = filteredSubjects.find(s => s.id === selectedSubjectId) || null

    const handleAddNote = (subjectId: number, note: string) => {
        console.log(`Přidána poznámka k předmětu ${subjectId}: ${note}`)
    }

    const handleAddFile = (subjectId: number, file: File) => {
        console.log(`Přidán soubor k předmětu ${subjectId}:`, file.name)
    }

return (
    <section className="mobile-study-plan-screen" id="study-plan-mobile">
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
            <article 
                key={subject.id} 
                className="subject-mobile-card"
                onClick={() => setSelectedSubjectId(subject.id)}
            >
            <div className={`subject-mobile-visual ${visual.tone}`}>{visual.icon}</div>
            <h3>{subject.name}</h3>
            <div className="subject-mobile-meta">
                <p>📄 {subject.files} souborů</p>
                <p>📝 {subject.notes} poznámek</p>
            </div>
            <div className="desktop-files-tabs" onClick={(e) => e.stopPropagation()}>
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

    <SubjectDetailModal 
        subject={selectedSubject}
        files={managedFiles}
        onClose={() => setSelectedSubjectId(null)}
        onAddNote={handleAddNote}
        onAddFile={handleAddFile}
    />
    </section>
)
}

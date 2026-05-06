
import React from 'react'
import { Button } from '../../components/ui/button'
import { Subject, SubjectVisual, ManagedFile } from '../../app/types'
import { SubjectDetailModal } from '../../components/shared/SubjectDetailModal'
import { SubjectActionButtons } from '../../components/shared/SubjectActionButtons'
import { SubjectGrid } from '../../components/shared/SubjectGrid'

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

    <SubjectGrid
        subjects={filteredSubjects}
        gridClassName="subjects-mobile-grid"
        emptyMessage="Nenalezeny žádné předměty."
        renderSubjectCard={(subject) => {
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
            <SubjectActionButtons
                subjectId={subject.id}
                isArchived={subject.archived}
                className="desktop-files-tabs"
                onEditSubject={onEditSubject}
                onToggleArchiveSubject={onToggleArchiveSubject}
                onDeleteSubject={onDeleteSubject}
            />
            </article>
        )
        }}
    />

    <Button type="button" className="subjects-fab" aria-label="Přidat předmět" onClick={onCreateSubject}>
        +
    </Button>

    <SubjectDetailModal 
        subject={selectedSubject}
        files={managedFiles}
        lessons={[]}
        onClose={() => setSelectedSubjectId(null)}
        onAddNote={handleAddNote}
        onAddFile={handleAddFile}
    />
    </section>
)
}



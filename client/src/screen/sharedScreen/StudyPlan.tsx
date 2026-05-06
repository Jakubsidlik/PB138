import React, { useMemo } from 'react'
import { Subject, ManagedFile, Lesson, DesktopSubjectTone, SubjectVisual } from '../../app/types'
import { SubjectDetailModal } from '../../components/shared/SubjectDetailModal'

// Sjednocený typ předmětu (obsahuje všechny vlastnosti z obou předchozích rozhraní)
type UnifiedSubject = Subject & {
  meta?: {
    icon: string
    tone: DesktopSubjectTone | string
  }
  deadlineCount?: number
}

type SubjectFilter = 'all' | 'active' | 'archived'

// Sjednocené Props
type UnifiedStudyPlanProps = {
  subjects: UnifiedSubject[]
  subjectVisualByCode?: Record<string, SubjectVisual> // Používá se jako fallback z mobilní verze
  subjectFilter: SubjectFilter
  setSubjectFilter: React.Dispatch<React.SetStateAction<SubjectFilter>>
  subjectSearch: string
  setSubjectSearch: React.Dispatch<React.SetStateAction<string>>
  onCreateSubject: () => void
  onEditSubject: (subjectId: number) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
  managedFiles: ManagedFile[]
  lessons?: Lesson[]
  onUploadFiles: (files: FileList | File[] | null, options?: { subjectId?: number; lessonId?: number }) => Promise<void>
  onAddNote: (subjectId: number, note: string) => Promise<void>
}

// Pomocná funkce pro Tailwind barvy karet
const getToneClasses = (tone: string = 'slate') => {
  const tones: Record<string, { bg: string; text: string; strip: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-600', strip: 'bg-red-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', strip: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', strip: 'bg-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', strip: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', strip: 'bg-purple-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', strip: 'bg-slate-500' },
  }
  return tones[tone] || tones.slate
}

export function UnifiedStudyPlan({
  subjects,
  subjectVisualByCode,
  subjectFilter,
  setSubjectFilter,
  subjectSearch,
  setSubjectSearch,
  onCreateSubject,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
  managedFiles,
  lessons = [],
  onUploadFiles,
  onAddNote,
}: UnifiedStudyPlanProps) {
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(null)
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null

  // Filtrace předmětů (kombinuje textový search z mobilu a tab filter z desktopu)
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      // 1. Filtr podle stavu
      if (subjectFilter === 'active' && subject.archived) return false
      if (subjectFilter === 'archived' && !subject.archived) return false
      
      // 2. Filtr podle textu
      if (subjectSearch.trim() === '') return true
      const searchLower = subjectSearch.toLowerCase()
      return subject.name.toLowerCase().includes(searchLower) || subject.code.toLowerCase().includes(searchLower)
    })
  }, [subjects, subjectFilter, subjectSearch])

  const handleAddNote = (subjectId: number, note: string) => {
    void onAddNote(subjectId, note)
  }

  const handleAddFile = (subjectId: number, file: File) => {
    void onUploadFiles([file], { subjectId })
  }

  return (
    <section className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      
      {/* Hlavička */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold">Studijní plán</h2>
        <p className="text-gray-500 hidden md:block">Přehled předmětů a jejich probíhajících úkolů</p>
      </div>

      {/* Ovládací panel (Filtry a Vyhledávání) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg border">
        
        {/* Filtry stavu */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            type="button"
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${subjectFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={() => setSubjectFilter('all')}
          >
            Všechny
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${subjectFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={() => setSubjectFilter('active')}
          >
            Aktivní
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${subjectFilter === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            onClick={() => setSubjectFilter('archived')}
          >
            Archivované
          </button>
        </div>

        {/* Vyhledávání */}
        <div className="relative w-full md:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={subjectSearch}
            onChange={(event) => setSubjectSearch(event.target.value)}
            placeholder="Hledat předměty..."
          />
        </div>
      </div>

      {/* Mřížka předmětů */}
      {filteredSubjects.length === 0 ? (
        <div className="p-12 text-center bg-white border rounded-lg text-gray-500">
          Nenalezeny žádné předměty odpovídající filtru.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Tlačítko pro přidání nového předmětu (Desktop to má jako kartu) */}
          <button 
            type="button" 
            className="hidden md:flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors min-h-[200px]"
            onClick={onCreateSubject}
          >
            <div className="text-4xl">＋</div>
            <span className="font-medium">Zapsat další předmět</span>
          </button>

          {/* Seznam existujících předmětů */}
          {filteredSubjects.map((subject) => {
            // Určení vizuálu (fallback na mobilní logiku, pokud není meta z desktopu)
            const visual = subject.meta || subjectVisualByCode?.[subject.code] || { icon: '📘', tone: 'slate' }
            const colors = getToneClasses(visual.tone)

            return (
              <article 
                key={subject.id} 
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative flex flex-col min-h-[200px]"
                onClick={() => setSelectedSubjectId(subject.id)}
              >
                {/* Barevný proužek nahoře (Desktop feature) */}
                <div className={`h-2 w-full ${colors.strip}`} />
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colors.bg} ${colors.text}`}>
                      {visual.icon}
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">
                      {subject.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg leading-tight mb-1">{subject.name}</h3>
                  <p className="text-sm text-gray-500 hidden md:block">{subject.teacher}</p>

                  {/* Statistiky */}
                  <div className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">📄 {subject.files}</span>
                    <span className="flex items-center gap-1">📝 {subject.notes}</span>
                    
                    {/* Zobrazení termínů (Desktop feature) */}
                    {subject.deadlineCount !== undefined && (
                      <span className={`flex items-center gap-1 ml-auto font-medium ${subject.deadlineCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {subject.deadlineCount > 0 ? `⚠️ ${subject.deadlineCount}` : '✅'}
                      </span>
                    )}
                  </div>
                  
                  {/* Akční tlačítka - zobrazí se jen na mobilu pro rychlý přístup */}
                  <div className="mt-4 pt-3 border-t flex justify-between gap-2 md:hidden" onClick={(e) => e.stopPropagation()}>
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => onEditSubject(subject.id)}>Upravit</button>
                    <button className="text-xs text-gray-600 hover:underline" onClick={() => onToggleArchiveSubject(subject.id)}>{subject.archived ? 'Obnovit' : 'Archivovat'}</button>
                    <button className="text-xs text-red-600 hover:underline" onClick={() => onDeleteSubject(subject.id)}>Smazat</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* FAB: Floating Action Button pro mobil (na desktopu je skrytý a nahrazený první kartou v gridu) */}
      <button 
        type="button" 
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 z-50"
        aria-label="Přidat předmět" 
        onClick={onCreateSubject}
      >
        +
      </button>

      {/* Detailní modální okno */}
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
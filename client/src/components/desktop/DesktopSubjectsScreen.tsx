import { DesktopSubjectMeta, DesktopSubjectTone, Subject } from '../../app/types'

type DesktopSubject = Subject & {
  meta: DesktopSubjectMeta
  deadlineCount: number
}

type DesktopSubjectsScreenProps = {
  desktopSubjects: DesktopSubject[]
}

export function DesktopSubjectsScreen({ desktopSubjects }: DesktopSubjectsScreenProps) {
  return (
    <section className="desktop-subjects-screen" id="desktop-subjects">
      <div className="desktop-subjects-head">
        <h2>Moje předměty</h2>
        <p>Přehled zapsaných kurzů pro aktuální semestr</p>
      </div>

      <div className="desktop-subjects-filters">
        <button type="button" className="active">Všechny</button>
        <button type="button">Povinné</button>
        <button type="button">Volitelné</button>
        <button type="button">Archivované</button>
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
            </div>
          </article>
        ))}

        <button type="button" className="desktop-subject-add-card">
          <div>＋</div>
          <span>Zapsat další předmět</span>
        </button>
      </div>
    </section>
  )
}

import { ReactNode } from 'react'

type SubjectGridProps<TSubject> = {
  subjects: TSubject[]
  gridClassName: string
  emptyMessage?: string
  renderSubjectCard: (subject: TSubject) => ReactNode
}

export function SubjectGrid<TSubject>({
  subjects,
  gridClassName,
  emptyMessage,
  renderSubjectCard,
}: SubjectGridProps<TSubject>) {
  return (
    <>
      <div className={gridClassName}>{subjects.map(renderSubjectCard)}</div>
      {subjects.length === 0 && emptyMessage ? <p className="subjects-empty">{emptyMessage}</p> : null}
    </>
  )
}
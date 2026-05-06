import { Button } from '../ui/button'

type SubjectActionButtonsProps = {
  subjectId: number
  isArchived?: boolean
  className?: string
  onEditSubject: (subjectId: number) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
}

export function SubjectActionButtons({
  subjectId,
  isArchived,
  className,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
}: SubjectActionButtonsProps) {
  return (
    <div className={className} onClick={(event) => event.stopPropagation()}>
      <Button type="button" onClick={() => onEditSubject(subjectId)}>
        Upravit
      </Button>
      <Button type="button" onClick={() => onToggleArchiveSubject(subjectId)}>
        {isArchived ? 'Obnovit' : 'Archivovat'}
      </Button>
      <Button type="button" onClick={() => onDeleteSubject(subjectId)}>
        Smazat
      </Button>
    </div>
  )
}
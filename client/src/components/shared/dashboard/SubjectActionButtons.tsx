import { Button } from '../../ui/button'
import { cn } from '@/lib/utils'

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
    <div className={cn("flex items-center gap-1", className)} onClick={(event) => event.stopPropagation()}>
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
        onClick={() => onEditSubject(subjectId)}
      >
        Upravit
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
        onClick={() => onToggleArchiveSubject(subjectId)}
      >
        {isArchived ? 'Obnovit' : 'Archivovat'}
      </Button>
      <div className="flex-1" />
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
        onClick={() => onDeleteSubject(subjectId)}
      >
        Smazat
      </Button>
    </div>
  )
}

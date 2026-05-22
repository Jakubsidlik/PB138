import { Button } from '../../ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Archive, Share2, Trash2 } from 'lucide-react'

type SubjectActionButtonsProps = {
  subjectId: number
  isArchived?: boolean
  className?: string
  onEditSubject: (subjectId: number) => void
  onToggleArchiveSubject: (subjectId: number) => void
  onDeleteSubject: (subjectId: number) => void
  onShare?: (subjectId: number) => void
}

export function SubjectActionButtons({
  subjectId,
  isArchived,
  className,
  onEditSubject,
  onToggleArchiveSubject,
  onDeleteSubject,
  onShare,
}: SubjectActionButtonsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-1.5 w-full", className)} onClick={(event) => event.stopPropagation()}>
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 w-full justify-start gap-1.5 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
        onClick={() => onEditSubject(subjectId)}
      >
        <Pencil className="w-3.5 h-3.5" />
        Upravit
      </Button>
      
      {onShare ? (
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-full justify-start gap-1.5 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => onShare(subjectId)}
        >
          <Share2 className="w-3.5 h-3.5" />
          Sdílet
        </Button>
      ) : (
        <div />
      )}

      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 w-full justify-start gap-1.5 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
        onClick={() => onToggleArchiveSubject(subjectId)}
      >
        <Archive className="w-3.5 h-3.5" />
        {isArchived ? 'Obnovit' : 'Archivovat'}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 w-full justify-start gap-1.5 px-2 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors text-destructive"
        onClick={() => onDeleteSubject(subjectId)}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Smazat
      </Button>
    </div>
  )
}

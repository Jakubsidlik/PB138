import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu'
import { EllipsisVerticalIcon } from 'lucide-react'

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            aria-label="Možnosti subjektu"
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEditSubject(subjectId)}>
            Upravit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleArchiveSubject(subjectId)}>
            {isArchived ? 'Obnovit' : 'Archivovat'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDeleteSubject(subjectId)}
            variant="destructive"
          >
            Smazat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
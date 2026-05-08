import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { initialsFromName } from './profileConstants'

type AvatarPreviewProps = {
  avatarDataUrl: string | null
  fullName: string
  imgClassName?: string
  fallbackClassName?: string
}

export function AvatarPreview({
  avatarDataUrl,
  fullName,
  imgClassName = 'size-full object-cover',
  fallbackClassName = 'bg-primary/10 text-primary flex items-center justify-center text-4xl font-extrabold',
}: AvatarPreviewProps) {
  return (
    <Avatar className="w-32 h-32 rounded-full border-4 border-muted">
      <AvatarImage src={avatarDataUrl || ''} alt="Profilová fotka" className={imgClassName} />
      <AvatarFallback className={fallbackClassName}>
        {initialsFromName(fullName)}
      </AvatarFallback>
    </Avatar>
  )
}

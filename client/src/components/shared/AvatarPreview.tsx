import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { initialsFromName } from './profileConstants'

type AvatarPreviewProps = {
  avatarDataUrl: string | null
  fullName: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function AvatarPreview({
  avatarDataUrl,
  fullName,
  className,
  size = 'default',
}: AvatarPreviewProps) {
  return (
    <Avatar size={size} className={className}>
      {avatarDataUrl && <AvatarImage src={avatarDataUrl} alt="Profilová fotka" />}
      <AvatarFallback>{initialsFromName(fullName)}</AvatarFallback>
    </Avatar>
  )
}

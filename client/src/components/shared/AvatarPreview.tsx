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
  imgClassName = 'w-32 h-32 rounded-full border-4 border-muted object-cover bg-muted/20',
  fallbackClassName = 'w-32 h-32 rounded-full border-4 border-muted bg-primary/10 text-primary flex items-center justify-center text-4xl font-extrabold',
}: AvatarPreviewProps) {
  if (avatarDataUrl) {
    return <img src={avatarDataUrl} alt="Profilová fotka" className={imgClassName} />
  }

  return <div className={fallbackClassName}>{initialsFromName(fullName)}</div>
}

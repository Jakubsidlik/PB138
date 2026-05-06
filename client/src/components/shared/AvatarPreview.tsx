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
  imgClassName = 'profile-photo-preview',
  fallbackClassName = 'profile-photo-preview profile-photo-fallback',
}: AvatarPreviewProps) {
  if (avatarDataUrl) {
    return <img src={avatarDataUrl} alt="Profilová fotka" className={imgClassName} />
  }

  return <div className={fallbackClassName}>{initialsFromName(fullName)}</div>
}

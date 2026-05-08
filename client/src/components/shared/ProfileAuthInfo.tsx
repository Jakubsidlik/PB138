import { AuthSession } from '../../app/types'

type ProfileAuthInfoProps = {
  authSession: AuthSession | null
}

export function ProfileAuthInfo({ authSession }: ProfileAuthInfoProps) {
  if (!authSession) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-lg">
        <span className="text-muted-foreground mr-2">Přihlášen/a:</span>
        <strong className="font-semibold">{authSession.fullName}</strong>
      </p>
      <p className="text-lg">
        <span className="text-muted-foreground mr-2">E-mail:</span>
        <strong className="font-semibold">{authSession.email}</strong>
      </p>
    </div>
  )
}

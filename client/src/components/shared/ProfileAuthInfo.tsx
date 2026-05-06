import { AuthSession } from '../../app/types'

type ProfileAuthInfoProps = {
  authSession: AuthSession | null
}

export function ProfileAuthInfo({ authSession }: ProfileAuthInfoProps) {
  if (!authSession) {
    return null
  }

  return (
    <div className="profile-grid">
      <p>
        Přihlášen/a: <strong>{authSession.fullName}</strong>
      </p>
      <p>
        E-mail: <strong>{authSession.email}</strong>
      </p>
      <p>
        Role: <strong>{authSession.role}</strong>
      </p>
    </div>
  )
}

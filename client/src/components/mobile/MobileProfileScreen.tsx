import React from 'react'
import { AuthSession, UserProfile } from '../../app/types'

type MobileProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onLogin: (email: string, password: string) => Promise<string | null>
  onRegister: (fullName: string, email: string, password: string) => Promise<string | null>
  onLogout: () => void
}

const initialsFromName = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

export function MobileProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onLogin,
  onRegister,
  onLogout,
}: MobileProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(true)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false)
  const [authFullName, setAuthFullName] = React.useState(profile.fullName)
  const [authEmail, setAuthEmail] = React.useState(profile.email)
  const [authPassword, setAuthPassword] = React.useState('')
  const [authMessage, setAuthMessage] = React.useState<string | null>(null)
  const [isAuthBusy, setIsAuthBusy] = React.useState(false)

  React.useEffect(() => {
    if (!authSession) {
      setAuthFullName(profile.fullName)
      setAuthEmail(profile.email)
    }
  }, [authSession, profile.email, profile.fullName])

  const handleLogin = async () => {
    setIsAuthBusy(true)
    const error = await onLogin(authEmail, authPassword)
    setIsAuthBusy(false)
    setAuthMessage(error ?? 'Přihlášení proběhlo úspěšně.')
    if (!error) {
      setAuthPassword('')
    }
  }

  const handleRegister = async () => {
    setIsAuthBusy(true)
    const error = await onRegister(authFullName, authEmail, authPassword)
    setIsAuthBusy(false)
    setAuthMessage(error ?? 'Registrace proběhla úspěšně.')
    if (!error) {
      setAuthPassword('')
    }
  }

  return (
    <section className="mobile-profile-screen" id="mobile-profile">
      <div className="mobile-profile-header">
        <div className="mobile-profile-avatar-wrap">
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="Profilová fotka" className="mobile-profile-avatar" />
          ) : (
            <div className="mobile-profile-avatar mobile-profile-avatar-fallback">
              {initialsFromName(profile.fullName)}
            </div>
          )}

          <button
            type="button"
            className="mobile-profile-avatar-action"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Nahrát profilovou fotku"
          >
            📷
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden-file-input"
            onChange={(event) => {
              onUploadAvatar(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </div>

        <h2>{profile.fullName || 'Uživatel'}</h2>
        <p>{profile.studyType}</p>

        <button type="button" className="mobile-profile-remove-photo" onClick={onRemoveAvatar}>
          Odebrat fotku
        </button>
      </div>

      <section className="mobile-profile-section">
        <h3>Přihlášení</h3>

        {authSession ? (
          <>
            <p>
              Přihlášen: <strong>{authSession.fullName}</strong>
            </p>
            <p>
              Role: <strong>{authSession.role}</strong>
            </p>
            <button type="button" className="mobile-profile-action-row" onClick={onLogout}>
              <span>Odhlásit</span>
              <span aria-hidden="true">›</span>
            </button>
          </>
        ) : (
          <>
            <label>
              <span>Jméno pro registraci</span>
              <input
                type="text"
                value={authFullName}
                onChange={(event) => setAuthFullName(event.target.value)}
              />
            </label>

            <label>
              <span>E-mail</span>
              <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
            </label>

            <label>
              <span>Heslo</span>
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
            </label>

            <button type="button" className="mobile-profile-action-row" disabled={isAuthBusy} onClick={handleLogin}>
              <span>Přihlásit</span>
              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              className="mobile-profile-action-row"
              disabled={isAuthBusy}
              onClick={handleRegister}
            >
              <span>Registrovat</span>
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}

        {authMessage ? <small>{authMessage}</small> : null}
      </section>

      <section className="mobile-profile-section">
        <h3>Osobní informace</h3>

        <label>
          <span>Celé jméno</span>
          <input
            type="text"
            value={profile.fullName}
            onChange={(event) => onChangeProfile('fullName', event.target.value)}
          />
        </label>

        <label>
          <span>E-mail</span>
          <input
            type="email"
            value={profile.email}
            onChange={(event) => onChangeProfile('email', event.target.value)}
          />
        </label>
      </section>

      <section className="mobile-profile-section">
        <h3>Studijní údaje</h3>

        <label>
          <span>Univerzita</span>
          <input
            type="text"
            value={profile.school}
            onChange={(event) => onChangeProfile('school', event.target.value)}
          />
        </label>

        <label>
          <span>Studijní zaměření</span>
          <input
            type="text"
            value={profile.studyMajor}
            onChange={(event) => onChangeProfile('studyMajor', event.target.value)}
          />
        </label>

        <label>
          <span>Ročník</span>
          <input
            type="text"
            value={profile.studyYear}
            onChange={(event) => onChangeProfile('studyYear', event.target.value)}
          />
        </label>

        <label>
          <span>Typ studia</span>
          <input
            type="text"
            value={profile.studyType}
            onChange={(event) => onChangeProfile('studyType', event.target.value)}
          />
        </label>
      </section>

      <section className="mobile-profile-section">
        <h3>Zabezpečení</h3>
        <button type="button" className="mobile-profile-action-row">
          <span>Změnit heslo</span>
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <section className="mobile-profile-section">
        <h3>Notifikace</h3>

        <label className="mobile-profile-toggle-row">
          <div>
            <strong>E-mailové notifikace</strong>
            <small>Týdenní souhrn a aktualizace</small>
          </div>
          <input
            type="checkbox"
            checked={emailNotificationsEnabled}
            onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
          />
        </label>

        <label className="mobile-profile-toggle-row">
          <div>
            <strong>Push notifikace</strong>
            <small>Deadline a připomenutí</small>
          </div>
          <input
            type="checkbox"
            checked={pushNotificationsEnabled}
            onChange={(event) => setPushNotificationsEnabled(event.target.checked)}
          />
        </label>
      </section>

      <div className="mobile-profile-save-wrap">
        <button type="button" className="mobile-profile-save">
          Uloženo automaticky
        </button>
      </div>
    </section>
  )
}

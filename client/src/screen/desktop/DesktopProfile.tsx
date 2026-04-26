import React from 'react'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from '../../components/shared/ThemeSelector'

type DesktopProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onResetProfile: () => void
  onLogin: (email: string, password: string) => Promise<string | null>
  onRegister: (fullName: string, email: string, password: string) => Promise<string | null>
  onLogout: () => void
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
}

const studyYearOptions = ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník']
const studyTypeOptions = ['Bakalářské studium', 'Magisterské studium', 'Doktorské studium']

export function DesktopProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onResetProfile,
  onLogin,
  onRegister,
  onLogout,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
}: DesktopProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
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
    <section className="desktop-profile-screen" id="desktop-profile">
      <div className="desktop-profile-head">
        <h2>Nastavení účtu</h2>
        <p>Spravuj profilové údaje, studium a avatar.</p>
      </div>

      <section className="profile-card">
        <h3>Přihlášení a role</h3>

        {authSession ? (
          <div className="profile-grid">
            <p>
              Přihlášen: <strong>{authSession.fullName}</strong> ({authSession.email})
            </p>
            <p>
              Role: <strong>{authSession.role}</strong>
            </p>
            <button type="button" onClick={onLogout}>
              Odhlásit
            </button>
          </div>
        ) : (
          <>
            <div className="profile-grid">
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
            </div>

            <div className="profile-actions-row">
              <button type="button" onClick={handleLogin} disabled={isAuthBusy}>
                Přihlásit
              </button>
              <button type="button" className="primary" onClick={handleRegister} disabled={isAuthBusy}>
                Registrovat
              </button>
            </div>
          </>
        )}

        {authMessage ? <p>{authMessage}</p> : null}
      </section>

      <section className="profile-card">
        <h3>Profilová fotka</h3>
        <div className="profile-photo-row">
          <div className="profile-photo-preview-wrap">
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="Profilová fotka" className="profile-photo-preview" />
            ) : (
              <div className="profile-photo-preview profile-photo-fallback">
                {profile.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </div>
            )}
            <button type="button" className="profile-photo-edit" onClick={() => fileInputRef.current?.click()}>
              📷
            </button>
          </div>

          <div className="profile-photo-actions">
            <p>Nahraj JPG/PNG/GIF (max 5MB) nebo odeber současný avatar.</p>
            <div>
              <button type="button" className="primary" onClick={() => fileInputRef.current?.click()}>
                Nahrát novou fotku
              </button>
              <button type="button" onClick={onRemoveAvatar}>
                Odebrat
              </button>
            </div>
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
        </div>
      </section>

      <section className="profile-card">
        <h3>Osobní údaje</h3>
        <div className="profile-grid">
          <label>
            <span>Jméno</span>
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

          <label>
            <span>Škola</span>
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
        </div>
      </section>

      <section className="profile-card">
        <h3>Studium</h3>
        <div className="profile-grid">
          <label>
            <span>Ročník</span>
            <select value={profile.studyYear} onChange={(event) => onChangeProfile('studyYear', event.target.value)}>
              {studyYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Typ studia</span>
            <select value={profile.studyType} onChange={(event) => onChangeProfile('studyType', event.target.value)}>
              {studyTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="profile-card">
        <h3>Vzhled</h3>
        <ThemeSelector
          currentTheme={themeMode}
          onThemeChange={onThemeChange}
          currentPalette={accentPalette}
          onPaletteChange={onPaletteChange}
        />
      </section>

      <div className="profile-actions-row">
        <button type="button" className="secondary" onClick={onResetProfile}>
          Zahodit změny
        </button>
        <button type="button" className="primary" disabled>
          Uloženo automaticky
        </button>
      </div>
    </section>
  )
}


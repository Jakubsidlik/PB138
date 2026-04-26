import React from 'react'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from '../../components/shared/ThemeSelector'

type MobileProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onLogout: () => void
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
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
  onLogout,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
}: MobileProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
        ) : null}
      </section>

      <section className="mobile-profile-section">
        <h3>Vzhled</h3>
        <ThemeSelector
          currentTheme={themeMode}
          onThemeChange={onThemeChange}
          currentPalette={accentPalette}
          onPaletteChange={onPaletteChange}
        />
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
        <h3>Vzhled</h3>
        <ThemeSelector
          currentTheme={themeMode}
          onThemeChange={onThemeChange}
          currentPalette={accentPalette}
          onPaletteChange={onPaletteChange}
        />
      </section>
    </section>
  )
}

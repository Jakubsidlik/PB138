import React from 'react'
import { Button } from '../../components/ui/button'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from '../../components/shared/ThemeSelector'

type MobileProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onResetProfile: () => void
  onLogout: () => void
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
  hasUnsavedChanges: boolean
  onSaveProfile: () => void
  isSavingProfile: boolean
}

const initialsFromName = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

const studyYearOptions = ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník', '7. ročník', '8. ročník', '9. ročník', '10. ročník']
const studyTypeOptions = ['Základní škola', 'Střední škola', 'Bakalářské studium', 'Magisterské studium', 'Doktorské studium']


export function MobileProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onResetProfile,
  onLogout,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
  hasUnsavedChanges,
  onSaveProfile,
  isSavingProfile,
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

          <Button
            type="button"
            className="mobile-profile-avatar-action"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Nahrát profilovou fotku"
          >
            📷
          </Button>

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

        <Button type="button" className="mobile-profile-remove-photo" onClick={onRemoveAvatar}>
          Odebrat fotku
        </Button>
      </div>

      <section className="mobile-profile-section">
        <h3>Registrovaný uživatel</h3>

        {authSession ? (
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
        ) : null}
      </section>

      <section className="mobile-profile-section">
        <h3>Studijní informace</h3>

        <label>
          <span>Škola</span>
          <input
            type="text"
            value={profile.school}
            onChange={(event) => onChangeProfile('school', event.target.value)}
          />
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
          <select value={profile.studyYear} onChange={(event) => onChangeProfile('studyYear', event.target.value)}>
            {studyYearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
      
      <section className="mobile-profile-section">
        <div className="profile-actions-row">
          <Button type="button" className="secondary" onClick={onResetProfile}>
            Zahodit změny
          </Button>
          <Button
            type="button"
            className="primary"
            disabled={!hasUnsavedChanges || isSavingProfile}
            onClick={onSaveProfile}
          >
            {isSavingProfile ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
        <Button type="button" className="mobile-profile-logout" onClick={onLogout}>
          Odhlásit se
        </Button>
      </section>
    </section>
  )
}



import React from 'react'
import { UserProfile } from '../../app/types'

type MobileProfileScreenProps = {
  profile: UserProfile
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
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
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
}: MobileProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(true)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false)

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

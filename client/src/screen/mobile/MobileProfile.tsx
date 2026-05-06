import React from 'react'
import { Button } from '../../components/ui/button'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { AvatarPreview } from '../../components/shared/AvatarPreview'
import { HiddenFileInput } from '../../components/shared/HiddenFileInput'
import { ProfileAuthInfo } from '../../components/shared/ProfileAuthInfo'
import { ProfileStudyInfoForm } from '../../components/shared/ProfileStudyInfoForm'
import { ProfileThemeSection } from '../../components/shared/ProfileThemeSection'
import { ProfileSaveActions } from '../../components/shared/ProfileSaveActions'

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
          <AvatarPreview
            avatarDataUrl={profile.avatarDataUrl}
            fullName={profile.fullName}
            imgClassName="mobile-profile-avatar"
            fallbackClassName="mobile-profile-avatar mobile-profile-avatar-fallback"
          />

          <Button
            type="button"
            className="mobile-profile-avatar-action"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Nahrát profilovou fotku"
          >
            📷
          </Button>

          <HiddenFileInput
            inputRef={fileInputRef}
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={onUploadAvatar}
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
        <ProfileAuthInfo authSession={authSession} />
      </section>

      <section className="mobile-profile-section">
        <h3>Studijní informace</h3>
        <ProfileStudyInfoForm profile={profile} onChangeProfile={onChangeProfile} />
      </section>

      <section className="mobile-profile-section">
        <h3>Vzhled</h3>
        <ProfileThemeSection
          themeMode={themeMode}
          onThemeChange={onThemeChange}
          accentPalette={accentPalette}
          onPaletteChange={onPaletteChange}
        />
      </section>
      
      <section className="mobile-profile-section">
        <ProfileSaveActions
          hasUnsavedChanges={hasUnsavedChanges}
          isSavingProfile={isSavingProfile}
          onResetProfile={onResetProfile}
          onSaveProfile={onSaveProfile}
        />
        <Button type="button" className="mobile-profile-logout" onClick={onLogout}>
          Odhlásit se
        </Button>
      </section>
    </section>
  )
}



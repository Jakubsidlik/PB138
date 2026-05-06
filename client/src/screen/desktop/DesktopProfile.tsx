import React from 'react'
import { Button } from '../../components/ui/button'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { AvatarPreview } from '../../components/shared/AvatarPreview'
import { HiddenFileInput } from '../../components/shared/HiddenFileInput'
import { ProfileAuthInfo } from '../../components/shared/ProfileAuthInfo'
import { ProfileStudyInfoForm } from '../../components/shared/ProfileStudyInfoForm'
import { ProfileThemeSection } from '../../components/shared/ProfileThemeSection'
import { ProfileSaveActions } from '../../components/shared/ProfileSaveActions'

type DesktopProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onResetProfile: () => void
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
  hasUnsavedChanges: boolean
  onSaveProfile: () => void
  isSavingProfile: boolean
}

export function DesktopProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onResetProfile,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
  hasUnsavedChanges,
  onSaveProfile,
  isSavingProfile,
}: DesktopProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <section className="desktop-profile-screen" id="desktop-profile">
      <div className="desktop-profile-head">
        <h2>Nastavení profilu</h2>
        <p>Spravuj profilový obrázek, osobní údaje a studijní informace</p>
      </div>

    <section className="profile-card">
        <h3>Profilová fotka</h3>
        <div className="profile-photo-row">
          <div className="profile-photo-preview-wrap">
            <AvatarPreview avatarDataUrl={profile.avatarDataUrl} fullName={profile.fullName} />
            <Button type="button" className="profile-photo-edit" onClick={() => fileInputRef.current?.click()}>
              📷
            </Button>
          </div>

          <div className="profile-photo-actions">
            <p>Nahraj JPG nebo PNG (max 5MB) nebo odeber současný avatar.</p>
            <div>
              <Button type="button" className="primary" onClick={() => fileInputRef.current?.click()}>
                Nahrát novou fotku
              </Button>
              <Button type="button" onClick={onRemoveAvatar}>
                Odebrat
              </Button>
            </div>
            <HiddenFileInput
              inputRef={fileInputRef}
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onUploadAvatar}
            />
          </div>
        </div>
      </section>

      <section className="profile-card">
        <h3>Registrovaný uživatel</h3>
        <ProfileAuthInfo authSession={authSession} />
      </section>

      <section className="profile-card">
        <h3>Studijní informace</h3>
        <div className="profile-grid">
          <ProfileStudyInfoForm profile={profile} onChangeProfile={onChangeProfile} />
        </div>
      </section>

      <section className="profile-card">
        <h3>Vzhled</h3>
        <ProfileThemeSection
          themeMode={themeMode}
          onThemeChange={onThemeChange}
          accentPalette={accentPalette}
          onPaletteChange={onPaletteChange}
        />
      </section>

      <ProfileSaveActions
        hasUnsavedChanges={hasUnsavedChanges}
        isSavingProfile={isSavingProfile}
        onResetProfile={onResetProfile}
        onSaveProfile={onSaveProfile}
      />
    </section>
  )
}



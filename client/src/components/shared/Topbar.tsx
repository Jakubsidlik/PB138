import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { getDailyMotto } from '../../app/utils'
import { Button } from '../ui/button'

type TopbarProps = {
  isCalendarScreen: boolean
  isFilesScreen: boolean
  isTasksScreen: boolean
  isStudyPlanScreen: boolean
  isProfileScreen: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  profileName: string
  profileAvatarDataUrl: string | null
  onOpenProfile: () => void
}

export function Topbar({
  isCalendarScreen,
  isFilesScreen,
  isTasksScreen,
  isStudyPlanScreen,
  isProfileScreen,
  fileInputRef,
  profileName,
  profileAvatarDataUrl,
  onOpenProfile,
}: TopbarProps) {
  const router = useRouter()

  const initials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  const handleBackClick = () => {
    router.navigate({ to: '/' })
  }

  return (
    <header className="topbar">
      <div className="topbar-mobile">
        {isProfileScreen ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={handleBackClick}
            >
              ←
            </Button>
            <h2 className="mobile-subjects-title">Nastavení profilu</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isCalendarScreen ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={handleBackClick}
            >
              ←
            </Button>
            <h2 className="mobile-subjects-title">Kalendář</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isTasksScreen ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={handleBackClick}
            >
              ←
            </Button>
            <h2 className="mobile-subjects-title">Úkoly</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isStudyPlanScreen ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={handleBackClick}
            >
              ←
            </Button>
            <h2 className="mobile-subjects-title">Studijní plán</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : (
          <div className="mobile-greeting">
            <div>
              <h1>{isFilesScreen ? 'Soubory' : 'Lonely Student'}</h1>
            </div>
          </div>
        )}

        {isTasksScreen || isStudyPlanScreen || isCalendarScreen || isProfileScreen ? null : isFilesScreen ? (
          <div className="mobile-files-actions">
            <Button
              type="button"
              variant="default"
              size="icon"
              className="mobile-notification mobile-notification-primary"
              aria-label="Přidat soubor"
              onClick={() => fileInputRef.current?.click()}
            >
              ＋
            </Button>
          </div>
        ) : null}
      </div>

      <div className="topbar-desktop">
        <div className="desktop-title-wrap">
          <p className="subtitle">{getDailyMotto()}</p>
        </div>
        <Button 
          type="button" 
          variant="ghost"
          className="profile" 
          onClick={onOpenProfile}
        >
          <div>
            <p className="name">{profileName}</p>
          </div>
          <div className="avatar">
            {profileAvatarDataUrl ? (
              <img src={profileAvatarDataUrl} alt="Profil" className="topbar-avatar-image" />
            ) : (
              initials
            )}
          </div>
        </Button>
      </div>
    </header>
  )
}

import React from 'react'
import { MobileNavItem } from '../../app/types'
import { getDailyMotto } from '../../app/utils'

type TopbarProps = {
  isCalendarScreen: boolean
  isFilesScreen: boolean
  isTasksScreen: boolean
  isStudyPlanScreen: boolean
  isProfileScreen: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
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
  setActiveMobileNav,
  profileName,
  profileAvatarDataUrl,
  onOpenProfile,
}: TopbarProps) {
  const initials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  return (
    <header className="topbar">
      <div className="topbar-mobile">
        {isProfileScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
            <h2 className="mobile-subjects-title">Nastavení profilu</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isCalendarScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
            <h2 className="mobile-subjects-title">Kalendář</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isTasksScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
            <h2 className="mobile-subjects-title">Úkoly</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : isStudyPlanScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
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
            <button
              type="button"
              className="mobile-notification mobile-notification-primary"
              aria-label="Přidat soubor"
              onClick={() => fileInputRef.current?.click()}
            >
              ＋
            </button>
          </div>
        ) : null}
      </div>

      <div className="topbar-desktop">
        <div className="desktop-title-wrap">
          <p className="subtitle">{getDailyMotto()}</p>
        </div>
        <button type="button" className="profile" onClick={onOpenProfile}>
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
        </button>
      </div>
    </header>
  )
}

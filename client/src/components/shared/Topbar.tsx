import React from 'react'
import { MobileNavItem } from '../../app/types'

type TopbarProps = {
  isCalendarScreen: boolean
  isFilesScreen: boolean
  isSubjectsScreen: boolean
  isProfileScreen: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  profileName: string
  profileSubtitle: string
  profileAvatarDataUrl: string | null
  onOpenProfile: () => void
}

export function Topbar({
  isCalendarScreen,
  isFilesScreen,
  isSubjectsScreen,
  isProfileScreen,
  fileInputRef,
  setActiveMobileNav,
  profileName,
  profileSubtitle,
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
        ) : isSubjectsScreen ? (
          <>
            <div className="mobile-header-icon" aria-hidden="true" />
            <h2 className="mobile-subjects-title">Moje předměty</h2>
            <div className="mobile-header-icon" aria-hidden="true" />
          </>
        ) : (
          <div className="mobile-greeting">
            <div className="mobile-avatar">{initials}</div>
            <div>
              <p>{isFilesScreen ? 'Správa souborů' : 'Vítej zpět'}</p>
              <h1>{isFilesScreen ? 'Soubory' : profileName}</h1>
            </div>
          </div>
        )}

        {isSubjectsScreen || isCalendarScreen || isProfileScreen ? null : isFilesScreen ? (
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
        ) : (
          <div className="mobile-home-actions">
            <button type="button" className="mobile-notification" aria-label="Profil" onClick={onOpenProfile}>
              👤
            </button>
          </div>
        )}
      </div>

      <div className="topbar-desktop">
        <div className="desktop-title-wrap">
          <p className="subtitle">PB138 Studijní plánovač</p>
        </div>
        <button type="button" className="profile" onClick={onOpenProfile}>
          <div>
            <p className="name">{profileName}</p>
            <p className="subtitle">{profileSubtitle}</p>
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

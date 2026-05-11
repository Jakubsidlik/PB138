import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { getDailyMotto } from '../../../app/utils'
import { Button } from '../../ui/button'
import { SidebarTrigger } from './Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'

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

  const renderMobileHeader = () => {
    if (isProfileScreen) {
      return (
        <>
          <div className="flex items-center gap-1">
            <SidebarTrigger />
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
          </div>
          <h2 className="mobile-subjects-title">Nastavení profilu</h2>
          <div className="w-20" />
        </>
      )
    }

    if (isCalendarScreen) {
      return (
        <>
          <div className="flex items-center gap-1">
            <SidebarTrigger />
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
          </div>
          <h2 className="mobile-subjects-title">Kalendář</h2>
          <div className="w-20" />
        </>
      )
    }

    if (isTasksScreen) {
      return (
        <>
          <div className="flex items-center gap-1">
            <SidebarTrigger />
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
          </div>
          <h2 className="mobile-subjects-title">Úkoly</h2>
          <div className="w-20" />
        </>
      )
    }

    if (isStudyPlanScreen) {
      return (
        <>
          <div className="flex items-center gap-1">
            <SidebarTrigger />
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
          </div>
          <h2 className="mobile-subjects-title">Studijní plán</h2>
          <div className="w-20" />
        </>
      )
    }

    if (isFilesScreen) {
      return (
        <>
          <div className="flex items-center gap-1">
            <SidebarTrigger />
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
          </div>
          <h2 className="mobile-subjects-title">Soubory</h2>
          <div className="w-20" />
        </>
      )
    }

    return (
      <>
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="mobile-greeting">
            <div>
              <h1>Lonely Student</h1>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <header className="topbar min-h-16 shrink-0">
      <div className="topbar-mobile">
        {renderMobileHeader()}

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
          <Avatar size="lg" className="border border-border">
            <AvatarImage src={profileAvatarDataUrl || ''} alt={profileName} />
            <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  )
}

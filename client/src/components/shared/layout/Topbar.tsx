import { useRouterState } from '@tanstack/react-router'
import { Button } from '../../ui/button'
import { SidebarTrigger } from './Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'

type TopbarProps = {
  isProfileScreen: boolean
  profileName: string
  profileAvatarDataUrl: string | null
  onOpenProfile: () => void
}

export function Topbar({
  isProfileScreen,
  profileName,
  profileAvatarDataUrl,
  onOpenProfile,
}: TopbarProps) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const initials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  // Determine current page title for mobile header
  const getPageTitle = (): string => {
    if (isProfileScreen) return 'Nastavení profilu'
    if (pathname.match(/^\/group\/\d+\/tier\/[A-Z]$/)) return 'Galerie'
    if (pathname.match(/^\/group\/\d+$/)) return 'Tier List'
    return 'Car-Y-list'
  }

  const renderMobileHeader = () => {
    return (
      <>
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="mobile-greeting">
            <div>
              <h1>{getPageTitle()}</h1>
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
          <SidebarTrigger />
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
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  )
}

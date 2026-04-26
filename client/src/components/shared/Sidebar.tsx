import React from 'react'
import { MobileNavItem } from '../../app/types'
import ghostLogo from '../../assets/ghostLogo.jpg'

type SidebarProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  onLogout: () => void
}

export function Sidebar({
  activeMobileNav,
  setActiveMobileNav,
  onLogout,
}: SidebarProps) {

  const handleLogoClick = () => {
    setActiveMobileNav('home')
    window.location.hash = ''
  }

  return (
    <aside className="sidebar">
      <button 
        type="button"
        className="brand-button"
        onClick={handleLogoClick}
        aria-label="Přejít na hlavní stránku"
      >
        <div className="brand">
          <img 
            src={ghostLogo}
            alt="Lonely Student Logo"
            className="brand-logo"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <h1>Lonely Student</h1>
        </div>
      </button>

      <nav className="menu">
        <div className="menu-main">
          <a
            className={`menu-item ${activeMobileNav === 'home' ? 'active' : ''}`}
            href="#"
            onClick={() => setActiveMobileNav('home')}
          >
            Hlavní stránka
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'calendar' ? 'active' : ''}`}
            href="#calendar"
            onClick={() => setActiveMobileNav('calendar')}
          >
            Kalendář
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'tasks' ? 'active' : ''}`}
            href="#tasks"
            onClick={() => setActiveMobileNav('tasks')}
          >
            Úkoly
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'files' ? 'active' : ''}`}
            href="#files"
            onClick={() => setActiveMobileNav('files')}
          >
            Soubory
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'study-plan' ? 'active' : ''}`}
            href="#study-plan"
            onClick={() => setActiveMobileNav('study-plan')}
          >
            Studijní plán
          </a>
        </div>

        <div className="menu-bottom">
          <a
            className={`menu-item ${activeMobileNav === 'profile' ? 'active' : ''}`}
            href="#profile"
            onClick={() => setActiveMobileNav('profile')}
          >
            Nastavení
          </a>
          <button type="button" className="menu-item menu-logout" onClick={onLogout}>
            Odhlásit se
          </button>
        </div>
      </nav>
    </aside>
  )
}

import React from 'react'
import { MobileNavItem } from '../../app/types'

type SidebarProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
}

export function Sidebar({
  activeMobileNav,
  setActiveMobileNav,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">PB</div>
        <div>
          <h1>Studijní plán</h1>
          <p>PB138</p>
        </div>
      </div>

      <nav className="menu">
        <a
          className={`menu-item ${activeMobileNav === 'home' ? 'active' : ''}`}
          href="#"
          onClick={() => setActiveMobileNav('home')}
        >
          Dashboard
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'calendar' ? 'active' : ''}`}
          href="#calendar"
          onClick={() => setActiveMobileNav('calendar')}
        >
          Kalendář
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'subjects' ? 'active' : ''}`}
          href="#subjects"
          onClick={() => setActiveMobileNav('subjects')}
        >
          Předměty
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'files' ? 'active' : ''}`}
          href="#files"
          onClick={() => setActiveMobileNav('files')}
        >
          Soubory
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'profile' ? 'active' : ''}`}
          href="#profile"
          onClick={() => setActiveMobileNav('profile')}
        >
          Profil
        </a>
      </nav>
    </aside>
  )
}

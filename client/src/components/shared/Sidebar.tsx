import React from 'react'
import { MobileNavItem } from '../../app/types'

type SidebarProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
}

export function Sidebar({ activeMobileNav, setActiveMobileNav }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🎓</div>
        <div>
          <h1>StudentHub</h1>
          <p>Academic v2.0</p>
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
      </nav>

      <div className="storage-card">
        <p className="storage-title">Storage Usage</p>
        <div className="storage-bar">
          <div className="storage-progress" />
        </div>
        <p className="storage-caption">6.5GB z 10GB použito</p>
      </div>
    </aside>
  )
}

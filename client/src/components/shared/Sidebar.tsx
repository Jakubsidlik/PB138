import { Link, useRouterState } from '@tanstack/react-router'
import ghostLogo from '../../assets/ghostLogo.jpg'

type SidebarProps = {
  onLogout: () => void
}

export function Sidebar({
  onLogout,
}: SidebarProps) {

  // aktuální URL pro active state
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const handleLogoClick = () => {
    // návrat na home route
    window.location.href = '/'
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
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <h1>Lonely Student</h1>
        </div>
      </button>

      <nav className="menu">
        <div className="menu-main">

          <Link
            to="/"
            className={`menu-item ${pathname === '/' ? 'active' : ''}`}
          >
            Hlavní stránka
          </Link>

          <Link
            to="/calendar"
            className={`menu-item ${pathname === '/calendar' ? 'active' : ''}`}
          >
            Kalendář
          </Link>

          <Link
            to="/tasks"
            className={`menu-item ${pathname === '/tasks' ? 'active' : ''}`}
          >
            Úkoly
          </Link>

          <Link
            to="/files"
            className={`menu-item ${pathname === '/files' ? 'active' : ''}`}
          >
            Soubory
          </Link>

          <Link
            to="/study"
            className={`menu-item ${pathname === '/study' ? 'active' : ''}`}
          >
            Studijní plán
          </Link>

        </div>

        <div className="menu-bottom">

          <Link
            to="/profile"
            className={`menu-item ${pathname === '/profile' ? 'active' : ''}`}
          >
            Nastavení
          </Link>

          <button
            type="button"
            className="menu-item menu-logout"
            onClick={onLogout}
          >
            Odhlásit se
          </button>

        </div>
      </nav>
    </aside>
  )
}
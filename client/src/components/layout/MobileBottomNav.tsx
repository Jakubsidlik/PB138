import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Home, Files, User, Plus, CheckSquare, BookMarked } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'

export function MobileBottomNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleNavigateTo = (path: string) => {
    router.navigate({ to: path as any })
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen])

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t" aria-label="Mobilní navigace">
      <div className="nav-dropdown-wrapper" ref={dropdownRef}>
        <button
          className={`nav-dropdown-btn ${isDropdownOpen ? 'active' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Otevřít menu"
          aria-expanded={isDropdownOpen}
        >
          <Plus size={24} />
          <span className="nav-label">Více</span>
        </button>
        {isDropdownOpen && (
          <div className="nav-dropdown-menu">
            <button onClick={() => handleNavigateTo('/tasks')}>
              <CheckSquare size={20} />
              <span>Úkoly</span>
            </button>
            <button onClick={() => handleNavigateTo('/files')}>
              <Files size={20} />
              <span>Soubory</span>
            </button>
            <button onClick={() => handleNavigateTo('/study')}>
              <BookMarked size={20} />
              <span>Studijní plán</span>
            </button>
          </div>
        )}
      </div>
      <button onClick={() => handleNavigateTo('/calendar')}>
        <Calendar size={24} />
        <span className="nav-label">Kalendář</span>
      </button>
      <button onClick={() => handleNavigateTo('/')}>
        <Home size={24} />
        <span className="nav-label">Domů</span>
      </button>
      <button onClick={() => handleNavigateTo('/profile')}>
        <User size={24} />
        <span className="nav-label">Profil</span>
      </button>
    </nav>
  )
}
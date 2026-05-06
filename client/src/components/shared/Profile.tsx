import React from 'react'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from '../../components/shared/ThemeSelector'

// Sjednocené Props
type UnifiedProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onResetProfile: () => void
  onLogout: () => void // Přidáno pro obě platformy
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
  hasUnsavedChanges: boolean
  onSaveProfile: () => void
  isSavingProfile: boolean
}

// Pomocné konstanty a funkce
const studyYearOptions = ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník', '7. ročník', '8. ročník', '9. ročník', '10. ročník']
const studyTypeOptions = ['Základní škola', 'Střední škola', 'Bakalářské studium', 'Magisterské studium', 'Doktorské studium']

const initialsFromName = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

export function UnifiedProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onResetProfile,
  onLogout,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
  hasUnsavedChanges,
  onSaveProfile,
  isSavingProfile,
}: UnifiedProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <section className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
      
      {/* Hlavička */}
      <div className="text-center md:text-left mb-2">
        <h2 className="text-2xl font-bold">Nastavení profilu</h2>
        <p className="text-gray-500">Spravuj profilový obrázek, osobní údaje a studijní informace</p>
      </div>

      {/* Profilová fotka - Karta */}
      <section className="bg-white rounded-xl border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="Profilová fotka" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border" />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold border">
              {initialsFromName(profile.fullName)}
            </div>
          )}
          {/* Rychlá akce foťáku na mobilu */}
          <button
            type="button"
            className="md:hidden absolute bottom-0 right-0 bg-blue-600 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Nahrát profilovou fotku"
          >
            📷
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="md:hidden">
            <h3 className="text-xl font-bold">{profile.fullName || 'Uživatel'}</h3>
            <p className="text-gray-500">{profile.studyType}</p>
          </div>
          
          <div className="hidden md:block">
            <h3 className="font-bold text-lg mb-1">Profilová fotka</h3>
            <p className="text-gray-500 text-sm">Nahraj JPG nebo PNG (max 5MB) nebo odeber současný avatar.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <button 
              type="button" 
              className="hidden md:block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              onClick={() => fileInputRef.current?.click()}
            >
              Nahrát novou fotku
            </button>
            <button 
              type="button" 
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium"
              onClick={onRemoveAvatar}
            >
              Odebrat fotku
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(event) => {
              onUploadAvatar(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registrovaný uživatel - Karta */}
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Registrovaný uživatel</h3>
          {authSession ? (
            <div className="space-y-3 text-sm">
              <p className="flex flex-col md:flex-row md:justify-between">
                <span className="text-gray-500">Přihlášen/a:</span> 
                <strong className="font-medium">{authSession.fullName}</strong>
              </p>
              <p className="flex flex-col md:flex-row md:justify-between">
                <span className="text-gray-500">E-mail:</span> 
                <strong className="font-medium">{authSession.email}</strong>
              </p>
              <p className="flex flex-col md:flex-row md:justify-between">
                <span className="text-gray-500">Role:</span> 
                <strong className="font-medium">{authSession.role}</strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Uživatel není přihlášen.</p>
          )}
        </section>

        {/* Vzhled - Karta */}
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Vzhled aplikace</h3>
          <ThemeSelector
            currentTheme={themeMode}
            onThemeChange={onThemeChange}
            currentPalette={accentPalette}
            onPaletteChange={onPaletteChange}
          />
        </section>
      </div>

      {/* Studijní informace - Karta */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">Studijní informace</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Škola
            <input
              type="text"
              className="p-2 border rounded-md font-normal focus:ring-2 focus:ring-blue-500 outline-none"
              value={profile.school}
              onChange={(event) => onChangeProfile('school', event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Typ studia
            <select 
              className="p-2 border rounded-md font-normal bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={profile.studyType} 
              onChange={(event) => onChangeProfile('studyType', event.target.value)}
            >
              {studyTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Studijní zaměření
            <input
              type="text"
              className="p-2 border rounded-md font-normal focus:ring-2 focus:ring-blue-500 outline-none"
              value={profile.studyMajor}
              onChange={(event) => onChangeProfile('studyMajor', event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Ročník
            <select 
              className="p-2 border rounded-md font-normal bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={profile.studyYear} 
              onChange={(event) => onChangeProfile('studyYear', event.target.value)}
            >
              {studyYearOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Spodní akce */}
      <section className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-4">
        <button 
          type="button" 
          className="w-full md:w-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium" 
          onClick={onLogout}
        >
          Odhlásit se
        </button>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button 
            type="button" 
            className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium" 
            onClick={onResetProfile}
          >
            Zahodit změny
          </button>
          <button 
            type="button" 
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!hasUnsavedChanges || isSavingProfile}
            onClick={onSaveProfile}
          >
            {isSavingProfile ? 'Ukládám...' : 'Uložit změny'}
          </button>
        </div>
      </section>

    </section>
  )
}
import React from 'react'
import { FileTab, ManagedFile } from '../../app/types'

// Sloučené Props pro obě platformy
type UnifiedFilesScreenProps = {
  files: ManagedFile[] // Nahrazuje managedFiles i displayedRecentFiles
  fileTab: FileTab
  setFileTab: React.Dispatch<React.SetStateAction<FileTab>>
  isDragActive: boolean
  setIsDragActive: React.Dispatch<React.SetStateAction<boolean>>
  onDropToUpload: (event: React.DragEvent<HTMLDivElement>) => void
  onUploadFiles: (files: FileList | null) => void
  onManageFile: (fileId: number) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

// Mírně upravená pomocná funkce pro Tailwind barvy (místo vlastních CSS tříd)
const getFileIcon = (category: ManagedFile['category']) => {
  if (category === 'pdf') return { icon: '📕', tone: 'text-red-500 bg-red-100' }
  if (category === 'image') return { icon: '🖼️', tone: 'text-emerald-500 bg-emerald-100' }
  if (category === 'document') return { icon: '📄', tone: 'text-blue-500 bg-blue-100' }
  return { icon: '📁', tone: 'text-slate-500 bg-slate-100' }
}

export function UnifiedFilesScreen({
  files,
  fileTab,
  setFileTab,
  isDragActive,
  setIsDragActive,
  onDropToUpload,
  onUploadFiles,
  onManageFile,
  onDeleteFile,
  onToggleFileShared,
  fileInputRef,
}: UnifiedFilesScreenProps) {
  return (
    <section className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      
      {/* Hlavička - Na mobilu jen nadpis, na desktopu i s popiskem */}
      <div>
        <h2 className="text-2xl font-bold hidden md:block">Moje soubory</h2>
        <p className="text-gray-500 hidden md:block">Správa studijních materiálů a sdílení souborů.</p>
        <h3 className="text-xl font-bold md:hidden">Soubory <span className="text-gray-500">({files.length})</span></h3>
      </div>

      {/* ZÁLOŽKY (Tabs) - Původně jen na mobilu, schováme je pro desktop */}
      <div className="flex gap-2 md:hidden overflow-x-auto pb-2">
        <button 
          className={`px-4 py-2 rounded-full whitespace-nowrap ${fileTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} 
          onClick={() => setFileTab('all')}
        >
          Všechny
        </button>
        <button 
          className={`px-4 py-2 rounded-full whitespace-nowrap ${fileTab === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} 
          onClick={() => setFileTab('recent')}
        >
          Nedávné
        </button>
        <button 
          className={`px-4 py-2 rounded-full whitespace-nowrap ${fileTab === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} 
          onClick={() => setFileTab('shared')}
        >
          Sdílené
        </button>
      </div>

      {/* SEZNAM SOUBORŮ */}
      <div className="bg-white rounded-lg border overflow-hidden">
        
        {/* DESKTOP ZOBRAZENÍ: Tabulka (Skrytá na mobilu) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Název souboru</th>
                <th className="p-4 font-medium text-gray-600">Předmět</th>
                <th className="p-4 font-medium text-gray-600">Změna</th>
                <th className="p-4 font-medium text-gray-600">Velikost</th>
                <th className="p-4 font-medium text-gray-600 text-right">Akce</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const { icon, tone } = getFileIcon(file.category)
                const subjectCode = file.subjectId ? `SUB-${file.subjectId}` : 'N/A'

                return (
                  <tr key={file.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <span className={`w-8 h-8 rounded flex items-center justify-center text-sm ${tone}`}>{icon}</span>
                      <span className="font-medium">{file.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{subjectCode}</span>
                    </td>
                    <td className="p-4 text-gray-500">{file.addedLabel}</td>
                    <td className="p-4 text-gray-500">{file.size}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded" onClick={() => onToggleFileShared(file.id)} title={file.shared ? 'Odebrat sdílení' : 'Sdílet'}>
                          {file.shared ? '👥' : '🔒'}
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded" onClick={() => onManageFile(file.id)} title="Upravit">✎</button>
                        <button className="p-2 hover:bg-red-100 text-red-500 rounded" onClick={() => onDeleteFile(file.id)} title="Smazat">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILNÍ ZOBRAZENÍ: Karty/Seznam (Skryté na desktopu) */}
        <div className="flex flex-col divide-y md:hidden">
          {files.map((file) => {
            const { icon, tone } = getFileIcon(file.category)
            return (
              <article key={file.id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${tone}`}>
                  {icon}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.shared ? 'Sdílený' : 'Soukromý'} • {file.size}
                  </p>
                </div>
                <button 
                  className="p-2 text-gray-400 hover:text-gray-700"
                  aria-label="Více možností"
                  onClick={() => onManageFile(file.id)}
                >
                  ⋮
                </button>
              </article>
            )
          })}
        </div>

        {/* Prázdný stav */}
        {files.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Zatím nejsou dostupné žádné soubory.
          </div>
        )}
      </div>

      {/* SPOLEČNÁ UPLOAD SEKCE (Drag & Drop) */}
      <section 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 bg-white'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={onDropToUpload}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-3">☁️</div>
        <h3 className="font-bold text-lg hidden md:block">Rychlé nahrávání</h3>
        <p className="font-medium md:font-normal text-gray-700 md:text-gray-500">Přetáhněte soubory sem</p>
        <p className="text-sm text-gray-500 mt-1">nebo klikněte pro výběr z počítače</p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onUploadFiles(event.target.files)
            event.currentTarget.value = ''
          }}
        />
      </section>

    </section>
  )
}
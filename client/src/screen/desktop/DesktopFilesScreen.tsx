import React from 'react'
import { ManagedFile } from '../../app/types'

type DesktopFilesScreenProps = {
  managedFiles: ManagedFile[]
  fileInputRef: React.RefObject<HTMLInputElement>
  onUploadFiles: (files: FileList | null) => void
  onManageFile: (fileId: number) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number) => void
}

const getFileIcon = (category: ManagedFile['category']) => {
  if (category === 'pdf') {
    return { icon: '📕', tone: 'red' }
  }
  if (category === 'image') {
    return { icon: '🖼️', tone: 'green' }
  }
  if (category === 'document') {
    return { icon: '📄', tone: 'blue' }
  }

  return { icon: '📁', tone: 'slate' }
}

export function DesktopFilesScreen({
  managedFiles,
  fileInputRef,
  onUploadFiles,
  onManageFile,
  onDeleteFile,
  onToggleFileShared,
}: DesktopFilesScreenProps) {
  const rows = managedFiles.slice(0, 4)

  return (
    <section className="desktop-files-screen" id="desktop-files">
      <div className="desktop-files-head">
        <h2>Moje soubory</h2>
        <p>Správa studijních materiálů a sdílení souborů.</p>
      </div>

      <section className="desktop-files-list-section">
        <div className="desktop-files-section-head">
          <h3>Přehled souborů</h3>
        </div>

        <div className="desktop-files-table-wrap">
          <table className="desktop-files-table">
            <thead>
              <tr>
                <th>Název souboru</th>
                <th>Předmět</th>
                <th>Změna</th>
                <th>Velikost</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((file) => {
                const { icon, tone } = getFileIcon(file.category)
                const subjectCode = file.subjectId ? `SUB-${file.subjectId}` : 'N/A'

                return (
                  <tr key={file.id}>
                    <td>
                      <div className="desktop-file-name">
                        <span className={`desktop-file-type-icon ${tone}`}>{icon}</span>
                        <span>{file.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="desktop-file-subject-badge">{subjectCode}</span>
                    </td>
                    <td>{file.addedLabel}</td>
                    <td>{file.size}</td>
                    <td>
                      <div className="desktop-view-switch">
                        <button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onToggleFileShared(file.id)}
                          title={file.shared ? 'Odebrat sdílení' : 'Sdílet'}
                        >
                          {file.shared ? '👥' : '🔒'}
                        </button>
                        <button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onManageFile(file.id)}
                          title="Upravit"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onDeleteFile(file.id)}
                          title="Smazat"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p>Zatím nejsou dostupné žádné soubory.</p> : null}
      </section>

      <section className="desktop-files-upload">
        <div className="desktop-upload-content">
          <div className="desktop-upload-icon">☁️</div>
          <h3>Rychlé nahrávání</h3>
          <p>Přetáhněte soubory sem nebo klikněte pro výběr z počítače.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Procházet soubory
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden-file-input"
            onChange={(event) => {
              onUploadFiles(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </div>
      </section>
    </section>
  )
}

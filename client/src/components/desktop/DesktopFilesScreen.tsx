import React from 'react'
import { FileFolder, ManagedFile, StudyFile } from '../../app/types'

type DesktopFilesScreenProps = {
  folders: FileFolder[]
  managedFiles: ManagedFile[]
  filesSeed: StudyFile[]
  fileInputRef: React.RefObject<HTMLInputElement>
  onUploadFiles: (files: FileList | null) => void
<<<<<<< HEAD
  onManageFile: (fileId: number) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number) => void
=======
>>>>>>> main
}

const folderToneByColor: Record<FileFolder['color'], string> = {
  amber: 'amber',
  emerald: 'emerald',
  primary: 'blue',
  slate: 'violet',
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
  folders,
  managedFiles,
  filesSeed,
  fileInputRef,
  onUploadFiles,
<<<<<<< HEAD
  onManageFile,
  onDeleteFile,
  onToggleFileShared,
=======
>>>>>>> main
}: DesktopFilesScreenProps) {
  const rows = managedFiles.slice(0, 4)

  return (
    <section className="desktop-files-screen" id="desktop-files">
      <div className="desktop-files-head">
        <h2>Moje soubory</h2>
        <p>Spravujte studijní materiály a dokumenty na jednom místě.</p>
      </div>

      <div className="desktop-files-tabs">
        <button type="button" className="active">Všechny soubory</button>
        <button type="button">Sdílené se mnou</button>
        <button type="button">Archiv</button>
      </div>

      <section className="desktop-files-folders">
        <div className="desktop-files-section-head">
          <h3>Složky předmětů</h3>
          <button type="button">Zobrazit vše</button>
        </div>

        <div className="desktop-folders-grid">
          {folders.map((folder) => (
            <article key={folder.id} className="desktop-folder-card">
              <div className="desktop-folder-top">
                <div className={`desktop-folder-icon ${folderToneByColor[folder.color]}`}>📁</div>
                <button type="button" className="desktop-folder-more" aria-label="Více možností">⋮</button>
              </div>
              <h4>{folder.name}</h4>
              <p>{folder.filesCount} souborů</p>
            </article>
          ))}
        </div>
      </section>

      <section className="desktop-files-list-section">
        <div className="desktop-files-section-head">
          <h3>Nedávné soubory</h3>
          <div className="desktop-view-switch">
            <button type="button">▦</button>
            <button type="button" className="active">☰</button>
          </div>
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
              {rows.map((file, index) => {
                const { icon, tone } = getFileIcon(file.category)
                const subjectCode = filesSeed[index]?.subject ?? 'GEN'

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
<<<<<<< HEAD
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
=======
                      <button type="button" className="desktop-file-download">⤓</button>
>>>>>>> main
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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

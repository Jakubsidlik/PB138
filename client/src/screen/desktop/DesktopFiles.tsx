import React from 'react'
import { Button } from '../../components/ui/button'
import { ManagedFile } from '../../app/types'
import { getFileIcon } from '../../components/shared/fileUtils'
import { HiddenFileInput } from '../../components/shared/HiddenFileInput'

type DesktopFilesScreenProps = {
  managedFiles: ManagedFile[]
  fileInputRef: React.RefObject<HTMLInputElement>
  onUploadFiles: (files: FileList | null) => void
  onManageFile: (fileId: number) => void
  onDeleteFile: (fileId: number) => void
  onToggleFileShared: (fileId: number) => void
}

export function DesktopFilesScreen({
  managedFiles,
  fileInputRef,
  onUploadFiles,
  onManageFile,
  onDeleteFile,
  onToggleFileShared,
}: DesktopFilesScreenProps) {
  const rows = managedFiles

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
                        <Button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onToggleFileShared(file.id)}
                          title={file.shared ? 'Odebrat sdílení' : 'Sdílet'}
                        >
                          {file.shared ? '👥' : '🔒'}
                        </Button>
                        <Button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onManageFile(file.id)}
                          title="Upravit"
                        >
                          ✎
                        </Button>
                        <Button
                          type="button"
                          className="desktop-file-download"
                          onClick={() => onDeleteFile(file.id)}
                          title="Smazat"
                        >
                          🗑
                        </Button>
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
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            Procházet soubory
          </Button>
          <HiddenFileInput
            inputRef={fileInputRef}
            multiple
            onChange={onUploadFiles}
          />
        </div>
      </section>
    </section>
  )
}



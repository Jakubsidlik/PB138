import React from 'react'
import { FileTab, ManagedFile } from '../../app/types'

type MobileFilesScreenProps = {
  fileTab: FileTab
  setFileTab: React.Dispatch<React.SetStateAction<FileTab>>
  displayedRecentFiles: ManagedFile[]
  isDragActive: boolean
  setIsDragActive: React.Dispatch<React.SetStateAction<boolean>>
  onDropToUpload: (event: React.DragEvent<HTMLDivElement>) => void
  onUploadFiles: (files: FileList | null) => void
  onManageFile: (fileId: number) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function MobileFilesScreen({
  fileTab,
  setFileTab,
  displayedRecentFiles,
  isDragActive,
  setIsDragActive,
  onDropToUpload,
  onUploadFiles,
  onManageFile,
  fileInputRef,
}: MobileFilesScreenProps) {
  return (
    <section className="mobile-files-screen" id="files-mobile">
      <div className="file-tabs">
        <button type="button" className={fileTab === 'all' ? 'active' : ''} onClick={() => setFileTab('all')}>
          Všechny
        </button>
        <button
          type="button"
          className={fileTab === 'recent' ? 'active' : ''}
          onClick={() => setFileTab('recent')}
        >
          Nedávné
        </button>
        <button
          type="button"
          className={fileTab === 'shared' ? 'active' : ''}
          onClick={() => setFileTab('shared')}
        >
          Sdílené
        </button>
      </div>

      <section className="files-section">
        <h3>
          Soubory <span>({displayedRecentFiles.length})</span>
        </h3>
        <div className="recent-files-list">
          {displayedRecentFiles.map((file) => (
            <article key={file.id} className="recent-file-item">
              <div className={`recent-file-icon ${file.category}`}>
                {file.category === 'pdf' ? '📕' : file.category === 'image' ? '🖼️' : '📄'}
              </div>
              <div className="recent-file-content">
                <p>{file.name}</p>
                <small>
                  {file.shared ? 'Sdílený' : 'Soukromý'} • {file.size}
                </small>
              </div>
              <button
                type="button"
                className="recent-file-more"
                aria-label="Více možností"
                onClick={() => onManageFile(file.id)}
              >
                ⋮
              </button>
            </article>
          ))}
        </div>
        {displayedRecentFiles.length === 0 ? <p>V této záložce nejsou žádné soubory.</p> : null}
      </section>

      <section className="upload-area-wrap">
        <div
          className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragActive(true)
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={onDropToUpload}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="upload-icon">☁️</div>
          <p>Přetáhněte soubory sem</p>
          <small>nebo klikněte pro výběr z počítače</small>
        </div>
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
      </section>
    </section>
  )
}

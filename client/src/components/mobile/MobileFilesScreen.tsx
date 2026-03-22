import React from 'react'
import { FileTab, FileFolder, ManagedFile } from '../../app/types'

type MobileFilesScreenProps = {
  fileTab: FileTab
  setFileTab: React.Dispatch<React.SetStateAction<FileTab>>
  fileTypeFilter: 'all' | 'folder' | 'pdf' | 'image'
  setFileTypeFilter: React.Dispatch<React.SetStateAction<'all' | 'folder' | 'pdf' | 'image'>>
  folders: FileFolder[]
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
  fileTypeFilter,
  setFileTypeFilter,
  folders,
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
          All Files
        </button>
        <button
          type="button"
          className={fileTab === 'recent' ? 'active' : ''}
          onClick={() => setFileTab('recent')}
        >
          Recent
        </button>
        <button
          type="button"
          className={fileTab === 'shared' ? 'active' : ''}
          onClick={() => setFileTab('shared')}
        >
          Shared
        </button>
      </div>

      <div className="file-filters no-scrollbar">
        <button
          type="button"
          className={fileTypeFilter === 'folder' ? 'active' : ''}
          onClick={() => setFileTypeFilter((prev) => (prev === 'folder' ? 'all' : 'folder'))}
        >
          Folders ▾
        </button>
        <button
          type="button"
          className={fileTypeFilter === 'pdf' ? 'active' : ''}
          onClick={() => setFileTypeFilter((prev) => (prev === 'pdf' ? 'all' : 'pdf'))}
        >
          PDFs ▾
        </button>
        <button
          type="button"
          className={fileTypeFilter === 'image' ? 'active' : ''}
          onClick={() => setFileTypeFilter((prev) => (prev === 'image' ? 'all' : 'image'))}
        >
          Images ▾
        </button>
      </div>

      <section className="files-section">
        <h3>
          Folders <span>({folders.length})</span>
        </h3>
        <div className="folders-grid">
          {folders.map((folder) => (
            <article key={folder.id} className="folder-card">
              <span className={`folder-icon ${folder.color}`}>📁</span>
              <p>{folder.name}</p>
              <small>{folder.filesCount} files</small>
            </article>
          ))}
        </div>
      </section>

      <section className="files-section">
        <h3>
          Recent Files <span>({displayedRecentFiles.length})</span>
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
                  {file.addedLabel} • {file.size}
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

import React from 'react'

type AvatarUploadProps = {
  avatarDataUrl: string | null
  fullName: string
  onUpload: (files: FileList | null) => void
  onRemove: () => void
  variant: 'mobile' | 'desktop'
  isLoading?: boolean
}

const initialsFromName = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

export function AvatarUpload({
  avatarDataUrl,
  fullName,
  onUpload,
  onRemove,
  variant,
  isLoading = false,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(avatarDataUrl)

  React.useEffect(() => {
    setPreviewUrl(avatarDataUrl)
  }, [avatarDataUrl])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Soubor je příliš velký. Maximum je 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    onUpload(files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove()
  }

  if (variant === 'mobile') {
    return (
      <div className="avatar-upload-mobile">
        <div
          className={`avatar-upload-wrap ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Profilová fotka" className="avatar-preview" />
          ) : (
            <div className="avatar-fallback">
              {initialsFromName(fullName)}
            </div>
          )}

          <button
            type="button"
            className="avatar-action-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Nahrát profilovou fotku"
          >
            {isLoading ? '⏳' : '📷'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden-file-input"
            onChange={(event) => handleFileSelect(event.target.files)}
            disabled={isLoading}
          />
        </div>

        {previewUrl && (
          <button
            type="button"
            className="avatar-remove-button mobile"
            onClick={handleRemove}
            disabled={isLoading}
          >
            Odebrat fotku
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="avatar-upload-desktop">
      <div className="avatar-upload-preview-wrap">
        <div
          className={`avatar-upload-area ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Profilová fotka" className="avatar-preview" />
          ) : (
            <div className="avatar-fallback">
              {initialsFromName(fullName)}
            </div>
          )}

          <button
            type="button"
            className="avatar-action-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Nahrát profilovou fotku"
          >
            {isLoading ? '⏳' : '📷'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden-file-input"
            onChange={(event) => handleFileSelect(event.target.files)}
            disabled={isLoading}
          />
        </div>

        <div className="avatar-upload-info">
          <p>JPG/PNG/GIF/WebP • Max 5MB</p>
          {isDragging && <p className="drag-hint">Pusť soubor tady ⬇️</p>}
        </div>
      </div>

      <div className="avatar-upload-actions">
        <button
          type="button"
          className="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? 'Nahrávám...' : 'Nahrát nový avatar'}
        </button>
        {previewUrl && (
          <button
            type="button"
            className="secondary"
            onClick={handleRemove}
            disabled={isLoading}
          >
            Odebrat
          </button>
        )}
      </div>
    </div>
  )
}

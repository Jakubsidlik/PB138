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
  const [offsetX, setOffsetX] = React.useState(0)
  const [offsetY, setOffsetY] = React.useState(0)
  const [isDraggingImage, setIsDraggingImage] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    setPreviewUrl(avatarDataUrl)
  }, [avatarDataUrl])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type - only PNG and JPG
    const allowedTypes = ['image/png', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      alert('Prosím vyberte obrázek ve formátu PNG nebo JPG')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Soubor je příliš velký. Maximum je 5MB.')
      return
    }

    // Create preview and reset offset
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setOffsetX(0)
      setOffsetY(0)
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
    setOffsetX(0)
    setOffsetY(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove()
  }

  const handleImageMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault()
    setIsDraggingImage(true)
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingImage) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setOffsetX(newX)
    setOffsetY(newY)
  }

  const handleMouseUp = () => {
    setIsDraggingImage(false)
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
            <div className="avatar-circle-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <img 
                src={previewUrl} 
                alt="Profilová fotka" 
                className="avatar-preview" 
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)`, cursor: isDraggingImage ? 'grabbing' : 'grab' }}
                onMouseDown={handleImageMouseDown}
              />
            </div>
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
            accept="image/png,image/jpeg"
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
            <div className="avatar-circle-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <img 
                src={previewUrl} 
                alt="Profilová fotka" 
                className="avatar-preview" 
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)`, cursor: isDraggingImage ? 'grabbing' : 'grab' }}
                onMouseDown={handleImageMouseDown}
              />
            </div>
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
            accept="image/png,image/jpeg"
            className="hidden-file-input"
            onChange={(event) => handleFileSelect(event.target.files)}
            disabled={isLoading}
          />
        </div>

        <div className="avatar-upload-info">
          <p>PNG nebo JPG • Max 5MB</p>
          {previewUrl && <p className="drag-hint">Tahej obrázek pro posun ↕️↔️</p>}
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

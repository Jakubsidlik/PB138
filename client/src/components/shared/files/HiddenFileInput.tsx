import React from 'react'

type HiddenFileInputProps = {
  inputRef: React.RefObject<HTMLInputElement>
  accept?: string
  onChange: (files: FileList | null) => void
}

export function HiddenFileInput({ inputRef, accept, onChange }: HiddenFileInputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      style={{ display: 'none' }}
      onChange={(e) => onChange(e.target.files)}
    />
  )
}

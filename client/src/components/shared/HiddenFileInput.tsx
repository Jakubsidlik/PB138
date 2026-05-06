import React from 'react'

type HiddenFileInputProps = {
  inputRef: React.RefObject<HTMLInputElement>
  accept?: string
  multiple?: boolean
  onChange: (files: FileList | null) => void
}

export function HiddenFileInput({
  inputRef,
  accept,
  multiple = false,
  onChange,
}: HiddenFileInputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      className="hidden-file-input"
      onChange={(event) => {
        onChange(event.target.files)
        event.currentTarget.value = ''
      }}
    />
  )
}

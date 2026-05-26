export const buildFileKey = (uuid: string, filename: string): string => {
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
  const ext = filename.substring(filename.lastIndexOf('.'))

  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[()[\]{}<>]/g, '_')
    .replace(/^_+/g, '')

  return `${uuid}-${sanitized}${ext}`
}

export const buildFileUrl = (
  fileKey: string,
  bucket: string,
  endpoint?: string,
  region: string = 'eu-west-1',
): string => {
  if (endpoint) {
    return `${endpoint}/${bucket}/${fileKey}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`
}

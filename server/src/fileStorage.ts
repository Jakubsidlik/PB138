export const buildFileKey = (uuid: string, filename: string): string => {
  // Sanitize filename: remove extension, replace non-alphanumeric with underscore
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
  const ext = filename.substring(filename.lastIndexOf('.'))
  
  // Replace spaces and special characters with underscores
  const sanitized = nameWithoutExt
    .replace(/\s+/g, '_')      // spaces to underscore
    .replace(/[()[\]{}<>]/g, '_') // brackets/parentheses to underscore
    .replace(/^_+/g, '')       // trim underscores from start only
  
  return `${uuid}-${sanitized}${ext}`
}

export const buildFileUrl = (
  fileKey: string,
  bucket: string,
  endpoint?: string,
  region: string = 'eu-west-1',
): string => {
  if (endpoint) {
    // Supabase-compatible URL
    return `${endpoint}/${bucket}/${fileKey}`
  }
  
  // AWS S3 fallback URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`
}

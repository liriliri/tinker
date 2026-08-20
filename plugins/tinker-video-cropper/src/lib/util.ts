export const VIDEO_EXTENSIONS = [
  'mp4',
  'webm',
  'ogv',
  'ogg',
  'mov',
  'avi',
  'mkv',
  'm4v',
]

export const VIDEO_FILE_FILTER = {
  name: 'Video',
  extensions: VIDEO_EXTENSIONS,
}

export function isVideoFileName(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  return !!ext && VIDEO_EXTENSIONS.includes(ext)
}

export function createPlaceholderSrc(width: number, height: number) {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"/>`
  )}`
}

export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
]

export const TEXT_EXTENSIONS = [
  'txt',
  'md',
  'json',
  'js',
  'ts',
  'html',
  'css',
  'xml',
  'yaml',
  'yml',
  'log',
  'csv',
  'ini',
  'conf',
  'sh',
  'py',
  'rb',
  'java',
  'c',
  'cpp',
  'h',
  'go',
  'rs',
  'swift',
  'kt',
]

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

export function isImageUrl(url: string): boolean {
  if (url.startsWith('data:image/')) return true
  try {
    const u = new URL(url)
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u.pathname)
  } catch {
    return false
  }
}

function getExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || ''
}

export function isImageExtension(filePath: string): boolean {
  return IMAGE_EXTENSIONS.includes(getExtension(filePath))
}

export function isVideoExtension(filePath: string): boolean {
  return VIDEO_EXTENSIONS.includes(getExtension(filePath))
}

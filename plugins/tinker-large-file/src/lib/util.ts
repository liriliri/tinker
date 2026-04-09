import mime from 'licia/mime'
import splitPath from 'licia/splitPath'
import type { FilterTab } from '../types'

export function getFileCategory(fileName: string): FilterTab {
  const ext = splitPath(fileName).ext.slice(1)
  const mimeType = mime(ext)
  if (!mimeType) return 'other'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

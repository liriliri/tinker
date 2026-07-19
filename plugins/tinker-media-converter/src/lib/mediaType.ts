import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import splitPath from 'licia/splitPath'
import unique from 'licia/unique'
import { VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS } from 'share/lib/fileType'
import type { MediaType } from '../types'

export const MEDIA_EXTS = new Set([...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS])

export function detectMediaType(filePath: string): MediaType | null {
  const { ext } = splitPath(filePath)
  const e = lowerCase(ext.slice(1))
  if (VIDEO_EXTS.has(e)) return 'video'
  if (AUDIO_EXTS.has(e)) return 'audio'
  if (IMAGE_EXTS.has(e)) return 'image'
  return null
}

export function resolveMediaMode(paths: string[]): MediaType {
  if (isEmpty(paths)) {
    throw new Error('No media files provided.')
  }

  const types = map(paths, (filePath) => {
    const type = detectMediaType(filePath)
    if (!type) {
      throw new Error(`Unsupported media file: ${filePath}`)
    }
    return type
  })

  const uniqueTypes = unique(types)
  if (uniqueTypes.length !== 1) {
    throw new Error(
      'All files must be the same media type (video, audio, or image).'
    )
  }

  return uniqueTypes[0]
}

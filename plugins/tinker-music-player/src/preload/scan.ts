import { glob } from 'glob'
import normalizePath from 'licia/normalizePath'
import { AUDIO_EXTS } from 'share/lib/fileType'

const GLOB_EXTENSIONS = [...AUDIO_EXTS].join(',')

export async function scanAudioFiles(dirs: string[]): Promise<string[]> {
  if (dirs.length === 0) return []

  const patterns = dirs.map((dir) => `${dir}/**/*.{${GLOB_EXTENSIONS}}`)

  const files = await glob(patterns, {
    nodir: true,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.*/**'],
  })

  return [...new Set(files.map((file) => normalizePath(file)))]
}

import { glob } from 'glob'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import startWith from 'licia/startWith'
import unique from 'licia/unique'
import { IMAGE_EXTS } from 'share/lib/fileType'

const HEIC_EXTS = ['heic', 'heif']
const GLOB_EXTENSIONS = [...IMAGE_EXTS, ...HEIC_EXTS].join(',')

export function removeSubdirectories(paths: string[]): string[] {
  const normalized = paths.map((path) => rtrim(normalizePath(path), '/'))
  const result = [...normalized]

  for (let i = result.length - 1; i >= 0; i--) {
    const path = result[i]
    const isSubdirectory = result.some(
      (other, index) => index !== i && startWith(path, `${other}/`)
    )
    if (isSubdirectory) {
      result.splice(i, 1)
    }
  }

  return result
}

export async function scanPhotoFiles(dirs: string[]): Promise<string[]> {
  const uniqueDirs = removeSubdirectories(dirs)
  if (uniqueDirs.length === 0) return []

  const patterns = uniqueDirs.map((dir) => `${dir}/**/*.{${GLOB_EXTENSIONS}}`)

  const files = await glob(patterns, {
    nodir: true,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/.*/**',
      '**/.picasaoriginals/**',
      '**/Originals/**',
    ],
  })

  return unique(files.map((file) => normalizePath(file)))
}

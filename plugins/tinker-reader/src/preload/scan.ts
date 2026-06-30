import { glob } from 'glob'
import normalizePath from 'licia/normalizePath'
import rtrim from 'licia/rtrim'
import startWith from 'licia/startWith'
import unique from 'licia/unique'

const PDF_EXT = 'pdf'

function removeSubdirectories(paths: string[]): string[] {
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

export async function scanBookFiles(dirs: string[]): Promise<string[]> {
  const uniqueDirs = removeSubdirectories(dirs)
  if (uniqueDirs.length === 0) return []

  const patterns = uniqueDirs.map((dir) => `${dir}/**/*.${PDF_EXT}`)

  const files = await glob(patterns, {
    nodir: true,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.*/**'],
  })

  return unique(files.map((file) => normalizePath(file)))
}

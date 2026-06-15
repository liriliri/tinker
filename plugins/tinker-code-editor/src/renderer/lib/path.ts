import normalizePath from 'licia/normalizePath'
import ltrim from 'licia/ltrim'
import rtrim from 'licia/rtrim'
import splitPath from 'licia/splitPath'

export function relativePath(root: string, filePath: string): string {
  const rootNorm = normalizePath(root)
  const pathNorm = normalizePath(filePath)
  if (!rootNorm || !pathNorm.startsWith(rootNorm)) {
    return pathNorm
  }
  const rel = ltrim(pathNorm.slice(rootNorm.length), ['/', '\\'])
  return rel || '.'
}

export function parentDir(filePath: string): string {
  const { dir } = splitPath(normalizePath(filePath))
  const parent = rtrim(dir, '/')
  return parent || normalizePath(filePath)
}

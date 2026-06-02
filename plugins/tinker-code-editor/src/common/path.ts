import normalizePath from 'licia/normalizePath'

export function parentDir(filePath: string): string {
  const normalized = normalizePath(filePath)
  const i = normalized.lastIndexOf('/')
  return i > 0 ? normalized.substring(0, i) : normalized
}

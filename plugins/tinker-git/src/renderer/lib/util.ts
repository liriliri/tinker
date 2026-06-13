import splitPath from 'licia/splitPath'
import rtrim from 'licia/rtrim'

export function formatRefLabel(name: string, isHead: boolean): string {
  return isHead ? `${name} (HEAD)` : name
}

export function repoDirName(repoPath: string): string {
  const normalized = rtrim(repoPath, ['\\', '/'])
  const { name } = splitPath(normalized)
  return name || normalized
}

import splitPath from 'licia/splitPath'

export function formatRefLabel(name: string, isHead: boolean): string {
  return isHead ? `${name} (HEAD)` : name
}

export function repoDirName(repoPath: string): string {
  const normalized = repoPath.replace(/[\\/]+$/, '')
  const { name } = splitPath(normalized)
  return name || normalized
}

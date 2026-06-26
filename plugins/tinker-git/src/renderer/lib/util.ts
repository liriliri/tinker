import splitPath from 'licia/splitPath'
import rtrim from 'licia/rtrim'
import md5 from 'licia/md5'

export function formatRefLabel(name: string, isHead: boolean): string {
  return isHead ? `${name} (HEAD)` : name
}

export function repoDirName(repoPath: string): string {
  const normalized = rtrim(repoPath, ['\\', '/'])
  const { name } = splitPath(normalized)
  return name || normalized
}

const GRAVATAR_BASE = 'https://www.gravatar.com/avatar'

export function getGravatarUrl(
  email: string,
  size = 32,
  defaultStyle: 'mp' | 'robohash' = 'mp'
): string {
  const hash = md5(email.trim().toLowerCase())
  return `${GRAVATAR_BASE}/${hash}?s=${size}&d=${defaultStyle}`
}

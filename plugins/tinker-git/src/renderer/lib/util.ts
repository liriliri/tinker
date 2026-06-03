import splitPath from 'licia/splitPath'
import dateFormat from 'licia/dateFormat'

export function formatRefLabel(name: string, isHead: boolean): string {
  return isHead ? `${name} (HEAD)` : name
}

export function repoDirName(repoPath: string): string {
  const normalized = repoPath.replace(/[\\/]+$/, '')
  const { name } = splitPath(normalized)
  return name || normalized
}

export function formatCommitListDate(dateMs: number): {
  label: string
  title: string
} {
  const date = new Date(dateMs)
  const title = dateFormat(date, 'yyyy-mm-dd HH:MM:ss')
  const isToday = dateFormat(date, 'yyyy-mm-dd') === dateFormat('yyyy-mm-dd')

  return {
    label: isToday ? dateFormat(date, 'HH:MM') : dateFormat(date, 'yyyy-mm-dd'),
    title,
  }
}

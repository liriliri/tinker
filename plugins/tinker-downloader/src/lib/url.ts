import splitPath from 'licia/splitPath'

export function getFileName(urlOrPath: string): string {
  try {
    const pathname = new URL(urlOrPath).pathname
    return splitPath(pathname).name || ''
  } catch {
    return splitPath(urlOrPath).name || ''
  }
}

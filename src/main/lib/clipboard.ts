import isMac from 'licia/isMac'
import { clipboard } from 'electron'
import plist from 'plist'
import fs from 'fs-extra'

export async function getClipboardFilePaths(): Promise<string[]> {
  let filePaths: string[] = []

  if (isMac) {
    if (clipboard.has('NSFilenamesPboardType')) {
      const NSFilenamesPboardType = clipboard.read('NSFilenamesPboardType')
      try {
        filePaths = plist.parse(NSFilenamesPboardType) as string[]
      } catch {
        // ignore
      }
    }
  }

  const ret: string[] = []
  for (let i = 0, len = filePaths.length; i < len; i++) {
    const filePath = filePaths[i]
    if (await fs.pathExists(filePath)) {
      ret.push(filePath)
    }
  }

  return ret
}

import { contextBridge, shell } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { homedir, platform } from 'os'
import normalizePath from 'licia/normalizePath'
import type { IFileEntry, IDriveInfo } from '../common/types'

const execFileAsync = promisify(execFile)

const SKIP_ENTRIES = new Set(['.DS_Store', 'Thumbs.db'])

const SKIP_MOUNT_PREFIXES = [
  '/dev',
  '/private/var/folders',
  '/private/tmp',
  '/System/Volumes/Preboot',
  '/System/Volumes/VM',
  '/System/Volumes/xarts',
  '/System/Volumes/iSCPreboot',
  '/System/Volumes/Hardware',
  '/System/Volumes/Update',
  '/System/Volumes/Recovery',
  '/System/Volumes/Update/mnt1',
  '/boot',
]

const SKIP_FILESYSTEM_RE =
  /^(devfs|map |fdesc|autofs|tmpfs|vm\.|com\.apple|proc|sysfs|efivarfs)/

function formatDriveLabel(mountPath: string): string {
  const os = platform()
  const normalized = normalizePath(mountPath)

  if (os === 'darwin' && normalized === '/') {
    return 'Macintosh HD'
  }

  if (normalized.startsWith('/Volumes/')) {
    return normalized.slice('/Volumes/'.length) || normalized
  }

  if (normalized === '/') {
    return '/'
  }

  const base = path.basename(normalized)
  return base || normalized
}

async function getUnixDrives(): Promise<IDriveInfo[]> {
  const drives: IDriveInfo[] = []
  const seen = new Set<string>()

  try {
    const { stdout } = await execFileAsync('df', ['-Pl'], { encoding: 'utf8' })
    const lines = stdout.trim().split('\n').slice(1)

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 6) continue

      const filesystem = parts[0]
      const mountPath = parts[parts.length - 1]

      if (SKIP_FILESYSTEM_RE.test(filesystem)) continue
      if (SKIP_MOUNT_PREFIXES.some((prefix) => mountPath.startsWith(prefix))) {
        continue
      }
      if (
        mountPath.startsWith('/System/Volumes/') &&
        mountPath !== '/System/Volumes/Data'
      ) {
        continue
      }

      const normalized = normalizePath(mountPath)
      if (seen.has(normalized)) continue
      seen.add(normalized)

      drives.push({
        label: formatDriveLabel(mountPath),
        path: mountPath,
      })
    }
  } catch {
    // fall through to fallback
  }

  if (drives.length === 0) {
    drives.push({
      label: platform() === 'darwin' ? 'Macintosh HD' : '/',
      path: '/',
    })
  }

  drives.sort((a, b) => a.label.localeCompare(b.label))
  return drives
}

const fileExplorerObj = {
  getHomedir(): string {
    return homedir()
  },

  dirname(filePath: string): string {
    return path.dirname(normalizePath(filePath))
  },

  basename(filePath: string): string {
    return path.basename(filePath)
  },

  joinPath(...parts: string[]): string {
    return path.join(...parts)
  },

  async readDir(dirPath: string): Promise<IFileEntry[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    const result: IFileEntry[] = []

    for (const entry of entries) {
      if (SKIP_ENTRIES.has(entry.name)) continue

      const fullPath = path.join(dirPath, entry.name)
      const isDirectory = entry.isDirectory()

      try {
        const stat = await fs.promises.stat(fullPath)
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory: stat.isDirectory(),
          size: stat.isDirectory() ? 0 : stat.size,
          mtimeMs: stat.mtimeMs,
        })
      } catch {
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory,
          size: 0,
          mtimeMs: 0,
        })
      }
    }

    return result
  },

  async getVolumes(): Promise<IDriveInfo[]> {
    if (platform() === 'win32') {
      const drives: IDriveInfo[] = []

      for (let code = 65; code <= 90; code++) {
        const letter = String.fromCharCode(code)
        const drivePath = `${letter}:\\`
        try {
          await fs.promises.access(drivePath)
          drives.push({ label: `${letter}:`, path: drivePath })
        } catch {
          // drive not mounted
        }
      }

      return drives
    }

    return getUnixDrives()
  },

  async createDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath)
  },

  async openPath(filePath: string): Promise<void> {
    await shell.openPath(filePath)
  },
}

contextBridge.exposeInMainWorld('fileExplorer', fileExplorerObj)

declare global {
  const fileExplorer: typeof fileExplorerObj
}

import { contextBridge, shell } from 'electron'
import si from 'systeminformation'
import fs from 'fs-extra'
import * as path from 'path'
import { homedir } from 'os'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import normalizePath from 'licia/normalizePath'
import type { IFileEntry, IDriveInfo } from '../common/types'

const SKIP_ENTRIES = new Set(['.DS_Store', 'Thumbs.db'])

async function findAvailableName(
  dirPath: string,
  name: string,
  excludePath?: string
): Promise<string> {
  const ext = path.extname(name)
  const base = ext ? path.basename(name, ext) : name

  let candidate = name
  let index = 1

  while (true) {
    const candidatePath = path.join(dirPath, candidate)
    if (
      excludePath &&
      normalizePath(candidatePath) === normalizePath(excludePath)
    ) {
      return candidate
    }
    if (!(await fs.pathExists(candidatePath))) {
      return candidate
    }
    candidate = ext ? `${base} (${index})${ext}` : `${base} (${index})`
    index++
  }
}

async function transferPaths(
  paths: string[],
  destDir: string,
  operation: 'copy' | 'move'
): Promise<{ processed: number; errors: string[] }> {
  let processed = 0
  const errors: string[] = []

  for (const sourcePath of paths) {
    try {
      const normalizedDest = normalizePath(destDir)
      const name = path.basename(sourcePath)
      const availableName = await findAvailableName(
        normalizedDest,
        name,
        operation === 'move' ? sourcePath : undefined
      )
      const targetPath = path.join(normalizedDest, availableName)

      if (
        operation === 'move' &&
        normalizePath(sourcePath) === normalizePath(targetPath)
      ) {
        processed++
        continue
      }

      if (operation === 'copy') {
        await fs.copy(sourcePath, targetPath)
      } else {
        await fs.move(sourcePath, targetPath)
      }

      processed++
    } catch {
      errors.push(sourcePath)
    }
  }

  return { processed, errors }
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
    const fsSizeData = await si.fsSize()
    const drives: IDriveInfo[] = []
    const seen = new Set<string>()

    for (const disk of fsSizeData) {
      if (disk.size <= 0) continue

      const mount = normalizePath(disk.mount)
      if (seen.has(mount)) continue

      if (isMac) {
        if (mount.startsWith('/System/Volumes/')) continue
        if (mount.startsWith('/private/')) continue
        if (mount === '/dev') continue
        if (mount !== '/' && !mount.startsWith('/Volumes/')) continue
      } else if (isWindows) {
        if (!/^[A-Z]:$/i.test(mount)) continue
      } else {
        if (
          mount.startsWith('/snap') ||
          mount.startsWith('/boot') ||
          mount.startsWith('/proc') ||
          mount.startsWith('/dev') ||
          mount.startsWith('/sys') ||
          mount.startsWith('/run') ||
          mount.startsWith('/tmp') ||
          mount.startsWith('/var')
        )
          continue
        if (
          mount !== '/' &&
          !mount.startsWith('/mnt/') &&
          !mount.startsWith('/media/')
        )
          continue
      }

      seen.add(mount)

      let label: string
      if (isMac && mount === '/') {
        label = 'Macintosh HD'
      } else if (mount.startsWith('/Volumes/')) {
        label = mount.slice('/Volumes/'.length) || mount
      } else if (isWindows) {
        label = mount
      } else if (mount === '/') {
        label = '/'
      } else {
        label = path.basename(mount) || mount
      }

      drives.push({ label, path: mount })
    }

    if (drives.length === 0) {
      drives.push({
        label: isMac ? 'Macintosh HD' : '/',
        path: '/',
      })
    }

    drives.sort((a, b) => a.label.localeCompare(b.label))
    return drives
  },

  async createDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath)
  },

  async renamePath(oldPath: string, newPath: string): Promise<void> {
    await fs.promises.rename(oldPath, newPath)
  },

  async trashPaths(
    paths: string[]
  ): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0
    const errors: string[] = []

    for (const filePath of paths) {
      try {
        await shell.trashItem(filePath)
        deleted++
      } catch {
        errors.push(filePath)
      }
    }

    return { deleted, errors }
  },

  async openPath(filePath: string): Promise<void> {
    await shell.openPath(filePath)
  },

  isPathInside(parentPath: string, childPath: string): boolean {
    const parent = normalizePath(parentPath)
    const child = normalizePath(childPath)

    if (parent === child) return true

    const prefix = parent.endsWith(path.sep) ? parent : `${parent}${path.sep}`
    return child.startsWith(prefix)
  },

  async copyPaths(
    paths: string[],
    destDir: string
  ): Promise<{ processed: number; errors: string[] }> {
    return transferPaths(paths, destDir, 'copy')
  },

  async movePaths(
    paths: string[],
    destDir: string
  ): Promise<{ processed: number; errors: string[] }> {
    return transferPaths(paths, destDir, 'move')
  },
}

contextBridge.exposeInMainWorld('fileExplorer', fileExplorerObj)

declare global {
  const fileExplorer: typeof fileExplorerObj
}

import { contextBridge } from 'electron'
import { watch, type FSWatcher } from 'chokidar'
import debounce from 'licia/debounce'
import mime from 'licia/mime'
import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import normalizePath from 'licia/normalizePath'
import type { IFileWatchEvent, FileWatchEventType } from '../common/types'
import {
  findGitRepoRoot,
  openRepository,
  getRepoPath,
  getCommitFileBlame,
  getWorkingTreeStatus,
  getWorkingTreeFileDiffContent,
  stageFile,
  unstageFile,
  discardFile,
  stageFiles,
  unstageAllFiles,
  discardFiles,
  commitStaged,
  watchWorkingTree,
} from 'share/preload/git'

const SKIP_ENTRIES = new Set(['.DS_Store', 'Thumbs.db', '.git'])

const WATCH_EVENTS = new Set<FileWatchEventType>([
  'add',
  'addDir',
  'change',
  'unlink',
  'unlinkDir',
])

let watcher: FSWatcher | null = null
let watchSession = 0
let pendingEvents: IFileWatchEvent[] = []
let flushDebounced: (() => void) | null = null

interface IDirEntry {
  name: string
  path: string
  isDirectory: boolean
}

const codeEditorObj = {
  getHomedir(): string {
    return homedir()
  },

  async readDir(dirPath: string): Promise<IDirEntry[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
    const result: IDirEntry[] = []

    for (const entry of entries) {
      if (SKIP_ENTRIES.has(entry.name)) continue
      result.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      })
    }

    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return result
  },

  async createDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath)
  },

  async renameItem(oldPath: string, newPath: string): Promise<void> {
    await fs.promises.rename(oldPath, newPath)
  },

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  },

  watchPaths(
    paths: string[],
    onChange: (events: IFileWatchEvent[]) => void
  ): () => void {
    const session = ++watchSession
    flushDebounced = null
    pendingEvents = []
    void watcher?.close()
    watcher = null

    if (paths.length === 0) {
      return () => {
        watchSession++
        flushDebounced = null
        pendingEvents = []
        void watcher?.close()
        watcher = null
      }
    }

    flushDebounced = debounce(() => {
      if (session !== watchSession) return
      const batch = pendingEvents
      pendingEvents = []
      if (batch.length > 0) onChange(batch)
    }, 300)

    setImmediate(() => {
      if (session !== watchSession) return

      const w = watch(paths, {
        ignoreInitial: true,
        persistent: true,
        depth: 0,
        ignorePermissionErrors: true,
      })

      if (session !== watchSession) {
        void w.close()
        return
      }

      watcher = w

      w.on('all', (event, filePath) => {
        if (!WATCH_EVENTS.has(event as FileWatchEventType)) return
        pendingEvents.push({
          type: event as FileWatchEventType,
          path: normalizePath(filePath),
        })
        flushDebounced?.()
      })
    })

    return () => {
      watchSession++
      flushDebounced = null
      pendingEvents = []
      void watcher?.close()
      watcher = null
    }
  },

  async readFileBinary(filePath: string): Promise<string> {
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const mimeType = (mime(ext) as string) || 'application/octet-stream'
    const buffer = await fs.promises.readFile(filePath)
    const base64 = buffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
  },

  // Git
  findGitRepoRoot,
  openRepository,
  getRepoPath,
  getCommitFileBlame,
  getWorkingTreeStatus,
  getWorkingTreeFileDiffContent,
  stageFile,
  unstageFile,
  discardFile,
  stageFiles,
  unstageAllFiles,
  discardFiles,
  commitStaged,
  watchWorkingTree,
}

contextBridge.exposeInMainWorld('codeEditor', codeEditorObj)

declare global {
  const codeEditor: typeof codeEditorObj
}

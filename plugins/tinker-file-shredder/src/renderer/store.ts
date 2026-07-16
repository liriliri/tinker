import { makeAutoObservable, runInAction } from 'mobx'
import concat from 'licia/concat'
import contain from 'licia/contain'
import each from 'licia/each'
import extend from 'licia/extend'
import filter from 'licia/filter'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import LocalStore from 'licia/LocalStore'
import map from 'licia/map'
import pluck from 'licia/pluck'
import splitPath from 'licia/splitPath'
import sum from 'licia/sum'
import BaseStore from 'share/store/Base'
import { getFileIcon } from 'share/lib/util'
import type { FileEntry, ShredMethod, ShredResult } from '../common/types'
import { createMcpApi } from './mcp'

const storage = new LocalStore('tinker-file-shredder')
const STORAGE_SHRED_METHOD = 'shredMethod'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  files: FileEntry[] = []
  shredMethod: ShredMethod = storage.get(STORAGE_SHRED_METHOD) || 'dod'
  shredding = false
  overallProgress = 0
  iconCache: Map<string, string> = new Map()

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get pendingFiles(): FileEntry[] {
    return filter(this.files, (file) => file.status === 'pending')
  }

  get pendingCount(): number {
    return this.pendingFiles.length
  }

  get pendingSize(): number {
    return sum(...pluck(this.pendingFiles, 'size'))
  }

  get hasFiles(): boolean {
    return !isEmpty(this.files)
  }

  setShredMethod(method: ShredMethod) {
    this.shredMethod = method
    storage.set(STORAGE_SHRED_METHOD, method)
  }

  async loadFileIcon(filePath: string) {
    if (this.iconCache.has(filePath)) return

    const icon = await getFileIcon(filePath)
    if (icon) {
      runInAction(() => {
        this.iconCache.set(filePath, icon)
      })
    }
  }

  removeFile(path: string) {
    if (this.shredding) return
    this.files = filter(this.files, (file) => file.path !== path)
  }

  clearFiles() {
    this.files = []
    this.overallProgress = 0
  }

  async addFilePaths(paths: string[]) {
    const existing = new Set(pluck(this.files, 'path'))
    const entries: FileEntry[] = []

    for (const filePath of paths) {
      if (existing.has(filePath)) continue

      const stat = await fileShredder.statFile(filePath)
      if (!stat?.isFile) continue

      entries.push({
        path: filePath,
        name: splitPath(filePath).name,
        size: stat.size,
        status: 'pending',
        progress: 0,
      })
      existing.add(filePath)
    }

    if (!isEmpty(entries)) {
      this.files = concat(this.files, entries)
    }
  }

  async addFiles() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled || isEmpty(result.filePaths)) return
    await this.addFilePaths(result.filePaths)
  }

  async addFolder() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || isEmpty(result.filePaths)) return

    const filePaths = await fileShredder.readDir(result.filePaths[0])
    await this.addFilePaths(filePaths)
  }

  private updateFile(
    filePath: string,
    patch: Partial<Pick<FileEntry, 'status' | 'progress' | 'error'>>
  ) {
    const file = find(this.files, (item) => item.path === filePath)
    if (file) {
      extend(file, patch)
    }
  }

  cancelShred() {
    if (!this.shredding) return
    fileShredder.cancelShred()
  }

  async shredAll(): Promise<ShredResult | null> {
    const paths = pluck(this.pendingFiles, 'path')
    if (isEmpty(paths) || this.shredding) return null

    this.shredding = true
    this.overallProgress = 0

    each(paths, (filePath) => {
      this.updateFile(filePath, {
        status: 'shredding',
        progress: 0,
        error: undefined,
      })
    })

    try {
      const result = await fileShredder.shredFiles(
        paths,
        this.shredMethod,
        (event) => {
          runInAction(() => {
            this.overallProgress = event.overallProgress
            this.updateFile(event.path, {
              status: 'shredding',
              progress: event.fileProgress,
            })
          })
        }
      )

      runInAction(() => {
        const errorMap = new Map(
          map(result.errors, (error) => [error.path, error.message])
        )

        each(paths, (filePath) => {
          const message = errorMap.get(filePath)
          if (message) {
            this.updateFile(filePath, {
              status: 'error',
              progress: 0,
              error: message,
            })
          }
        })

        this.files = filter(
          this.files,
          (file) => !contain(paths, file.path) || file.status === 'error'
        )
        this.shredding = false
        this.overallProgress = 0
      })

      return result
    } catch {
      runInAction(() => {
        this.shredding = false
        this.overallProgress = 0
      })
      return null
    }
  }
}

export default new Store()

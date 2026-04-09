import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { FileEntry } from '../common/types'
import type { FilterTab } from './types'
import { collectLargeFiles } from './lib/dataProcess'
import { getFileCategory } from './lib/util'

export type ViewState = 'open' | 'scanning' | 'result'

class Store extends BaseStore {
  view: ViewState = 'open'
  scanPath = ''
  scanProgress: { count: number; size: number } | null = null
  largeFiles: FileEntry[] = []
  scanTask: tinker.DiskUsageTask | null = null
  filterTab: FilterTab = 'all'
  selectedFiles: Set<string> = new Set()

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get selectedSize(): number {
    let size = 0
    for (const file of this.largeFiles) {
      if (this.selectedFiles.has(file.path)) {
        size += file.size
      }
    }
    return size
  }

  get selectedCount(): number {
    return this.selectedFiles.size
  }

  toggleFile(path: string) {
    const next = new Set(this.selectedFiles)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    this.selectedFiles = next
  }

  clearSelection() {
    this.selectedFiles = new Set()
  }

  async deleteSelected(): Promise<{
    deleted: number
    errors: string[]
  } | null> {
    const paths = Array.from(this.selectedFiles)
    if (paths.length === 0) return null
    let deleted = 0
    const errors: string[] = []
    for (const filePath of paths) {
      try {
        await tinker.rm(filePath)
        deleted++
      } catch {
        errors.push(filePath)
      }
    }
    runInAction(() => {
      const errSet = new Set(errors)
      const deletedSet = new Set(paths.filter((p) => !errSet.has(p)))
      this.largeFiles = this.largeFiles.filter((f) => !deletedSet.has(f.path))
      this.selectedFiles = new Set()
    })
    return { deleted, errors }
  }

  get filteredFiles(): FileEntry[] {
    if (this.filterTab === 'all') return this.largeFiles
    return this.largeFiles.filter(
      (file) => getFileCategory(file.name) === this.filterTab
    )
  }

  setFilterTab(tab: FilterTab) {
    this.filterTab = tab
  }

  async openDirectory(dirPath: string) {
    this.view = 'scanning'
    this.scanPath = dirPath
    this.scanProgress = { count: 0, size: 0 }
    this.largeFiles = []

    try {
      const task = tinker.getDiskUsage(
        { paths: [dirPath], maxDepth: 100, minRatio: 0.01 },
        (progress) => {
          runInAction(() => {
            if (this.scanProgress) {
              this.scanProgress.count = progress.count
              this.scanProgress.size = progress.size
            }
          })
        }
      )
      this.scanTask = task

      const result = await task
      const files = await collectLargeFiles(result)

      runInAction(() => {
        this.largeFiles = files
        this.view = 'result'
        this.scanTask = null
      })
    } catch (err) {
      console.error('Scan failed:', err)
      runInAction(() => {
        this.view = 'open'
        this.scanTask = null
        this.scanProgress = null
      })
    }
  }

  cancelScan() {
    if (this.scanTask) {
      this.scanTask.kill()
      this.scanTask = null
    }
    this.view = 'open'
    this.scanProgress = null
  }

  reset() {
    this.view = 'open'
    this.scanPath = ''
    this.scanProgress = null
    this.largeFiles = []
    this.selectedFiles = new Set()
  }
}

export default new Store()

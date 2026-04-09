import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { FileEntry, FilterTab } from './types'
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

  isSelected(path: string): boolean {
    return this.selectedFiles.has(path)
  }

  toggleFile(path: string) {
    if (this.selectedFiles.has(path)) {
      this.selectedFiles.delete(path)
    } else {
      this.selectedFiles.add(path)
    }
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

    const results = await Promise.allSettled(paths.map((p) => tinker.rm(p)))
    const errors: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') errors.push(paths[i])
    })

    runInAction(() => {
      const failSet = new Set(errors)
      this.largeFiles = this.largeFiles.filter((f) => failSet.has(f.path))
      this.selectedFiles = new Set()
    })
    return { deleted: paths.length - errors.length, errors }
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
    runInAction(() => {
      if (this.scanTask) {
        this.scanTask.kill()
        this.scanTask = null
      }
      this.view = 'open'
      this.scanProgress = null
    })
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

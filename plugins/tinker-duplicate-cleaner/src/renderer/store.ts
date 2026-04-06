import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { DuplicateGroup } from '../common/types'
import type { FilterTab } from './types'
import { findDuplicates } from './lib/dataProcess'
import { getFileCategory } from './lib/util'

export type ViewState = 'open' | 'scanning' | 'result'

class Store extends BaseStore {
  view: ViewState = 'open'
  scanPath = ''
  scanProgress: { count: number; size: number } | null = null
  duplicateGroups: DuplicateGroup[] = []
  scanTask: tinker.DiskUsageTask | null = null
  filterTab: FilterTab = 'all'
  selectedFiles: Set<string> = new Set()

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get selectedSize(): number {
    let size = 0
    for (const group of this.duplicateGroups) {
      for (const file of group.files) {
        if (this.selectedFiles.has(file.path)) {
          size += file.size
        }
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
    try {
      const result = await duplicateCleaner.deleteFiles(paths)
      return result
    } catch {
      return null
    }
  }

  get filteredGroups(): DuplicateGroup[] {
    if (this.filterTab === 'all') return this.duplicateGroups
    return this.duplicateGroups.filter(
      (group) => getFileCategory(group.files[0].name) === this.filterTab
    )
  }

  setFilterTab(tab: FilterTab) {
    this.filterTab = tab
  }

  async openDirectory(dirPath: string) {
    this.view = 'scanning'
    this.scanPath = dirPath
    this.scanProgress = { count: 0, size: 0 }
    this.duplicateGroups = []

    try {
      const task = tinker.getDiskUsage(
        { paths: [dirPath], maxDepth: 100, minRatio: 0 },
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
      const groups = await findDuplicates(result)

      runInAction(() => {
        this.duplicateGroups = groups
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
    this.duplicateGroups = []
    this.selectedFiles = new Set()
  }
}

export default new Store()

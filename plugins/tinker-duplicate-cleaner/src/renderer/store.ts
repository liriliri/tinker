import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { DuplicateGroup } from '../common/types'
import { findDuplicates } from './lib/dataProcess'

export type ViewState = 'open' | 'scanning' | 'result'

class Store extends BaseStore {
  view: ViewState = 'open'
  scanPath = ''
  scanProgress: { count: number; size: number } | null = null
  duplicateGroups: DuplicateGroup[] = []
  scanTask: tinker.DiskUsageTask | null = null

  constructor() {
    super()
    makeAutoObservable(this)
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
  }
}

export default new Store()

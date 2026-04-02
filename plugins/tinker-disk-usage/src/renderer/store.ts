import { makeAutoObservable, runInAction } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { DiskItem } from '../common/types'
import {
  applyDirectoryFlags,
  buildDiskData,
  collectLeafPaths,
  collectUnloadedLeafDirs,
  findBranch,
  mergeBranch,
  removeNodes,
} from './lib/dataProcess'
import type { ChartControls } from './lib/d3chart'

export type ViewState = 'open' | 'scanning' | 'chart'

const DEFAULT_MAX_DEPTH = 3

class Store extends BaseStore {
  view: ViewState = 'open'
  scanPath: string = ''
  scanProgress: { count: number; size: number; errors: number } | null = null
  diskData: DiskItem | null = null
  navigatePath: string = ''
  navigationHistory: string[] = []
  navigationIndex: number = -1
  chartControls: ChartControls | null = null
  scanTask: tinker.DiskUsageTask | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get currentData(): DiskItem | null {
    if (!this.diskData) return null
    if (!this.navigatePath) return this.diskData
    return findBranch(this.navigatePath, this.diskData) || this.diskData
  }

  get canGoBack(): boolean {
    return this.view === 'chart' && this.navigationIndex > 0
  }

  get canGoForward(): boolean {
    return (
      this.view === 'chart' &&
      this.navigationIndex < this.navigationHistory.length - 1
    )
  }

  get canGoUp(): boolean {
    return this.view === 'chart' && !!this.navigatePath
  }

  async openDirectory(dirPath: string) {
    this.view = 'scanning'
    this.scanPath = dirPath
    this.scanProgress = { count: 0, size: 0, errors: 0 }

    try {
      const task = tinker.getDiskUsage(
        { paths: [dirPath], maxDepth: DEFAULT_MAX_DEPTH },
        (progress) => {
          runInAction(() => {
            this.scanProgress = { ...progress }
          })
        }
      )

      this.scanTask = task

      const result = await task
      const data = buildDiskData(result)
      await this.resolveLeafTypes(data)

      runInAction(() => {
        this.diskData = data
        this.navigatePath = ''
        this.navigationHistory = ['']
        this.navigationIndex = 0
        this.view = 'chart'
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

  async navigateTo(id: string) {
    if (this.diskData && id) {
      const node = findBranch(id, this.diskData)
      if (node && !node.loaded && node.isDirectory) {
        try {
          const result = await tinker.getDiskUsage({
            paths: [id],
            maxDepth: DEFAULT_MAX_DEPTH,
          })
          const newData = buildDiskData(result)
          await this.resolveLeafTypes(newData)
          runInAction(() => {
            mergeBranch(this.diskData!, id, newData)
          })
        } catch (err) {
          console.error('On-demand scan failed:', err)
        }
      }
    }

    runInAction(() => {
      this.navigationHistory = this.navigationHistory.slice(
        0,
        this.navigationIndex + 1
      )
      this.navigationHistory.push(id)
      this.navigationIndex = this.navigationHistory.length - 1
      this.navigatePath = id
    })
  }

  async navigateUp() {
    if (!this.navigatePath || !this.diskData) return
    const current = findBranch(this.navigatePath, this.diskData)
    let parentPath: string
    if (!current || current.id === this.diskData.id) {
      parentPath = ''
    } else {
      const lastSlash = this.navigatePath.lastIndexOf('/')
      parentPath =
        lastSlash > 0 ? this.navigatePath.substring(0, lastSlash) : ''
    }
    await this.navigateTo(parentPath)
  }

  navigateBack() {
    if (!this.canGoBack) return
    this.navigationIndex--
    this.navigatePath = this.navigationHistory[this.navigationIndex]
  }

  navigateForward() {
    if (!this.canGoForward) return
    this.navigationIndex++
    this.navigatePath = this.navigationHistory[this.navigationIndex]
  }

  setChartControls(controls: ChartControls | null) {
    this.chartControls = controls
  }

  async expandNode(id: string) {
    if (!this.diskData) return

    const node = findBranch(id, this.diskData)
    if (!node || !node.isDirectory) return

    const unloaded = node.loaded ? collectUnloadedLeafDirs(node) : [node]
    if (unloaded.length === 0) return

    const results = await Promise.all(
      unloaded.map(async (leaf) => {
        try {
          const result = await tinker.getDiskUsage({
            paths: [leaf.id],
            maxDepth: 2,
          })
          const newData = buildDiskData(result)
          await this.resolveLeafTypes(newData)
          return { id: leaf.id, data: newData }
        } catch {
          return null
        }
      })
    )

    runInAction(() => {
      for (const entry of results) {
        if (entry) {
          mergeBranch(this.diskData!, entry.id, entry.data)
        }
      }
    })

    if (this.chartControls && this.currentData) {
      this.chartControls.render(this.currentData)
    }
  }

  private async resolveLeafTypes(data: DiskItem) {
    const leafPaths = collectLeafPaths(data)
    if (leafPaths.length === 0) return
    const dirMap = await diskUsage.checkDirectories(leafPaths)
    applyDirectoryFlags(data, dirMap)
  }

  deleteItem(id: string) {
    if (!this.diskData) return
    removeNodes(this.diskData, new Set([id]))
    if (this.chartControls && this.currentData) {
      this.chartControls.render(this.currentData)
    }
  }

  reset() {
    if (this.chartControls) {
      this.chartControls.destroy()
      this.chartControls = null
    }
    this.view = 'open'
    this.scanPath = ''
    this.scanProgress = null
    this.diskData = null
    this.navigatePath = ''
    this.navigationHistory = []
    this.navigationIndex = -1
  }
}

export default new Store()

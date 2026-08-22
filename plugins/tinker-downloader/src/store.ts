import { makeAutoObservable, observable, runInAction } from 'mobx'
import contain from 'licia/contain'
import find from 'licia/find'
import filter from 'licia/filter'
import i18n from 'i18next'
import toast from 'react-hot-toast'
import BaseStore, { storage } from 'share/store/Base'
import { createMcpApi } from './mcp'
import { FilterTab } from './types'

const STORAGE_SAVE_DIR = 'saveDir'

function isFinished(d: tinker.DownloadTask): boolean {
  return d.state === 'completed' || d.state === 'cancelled'
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  downloads: tinker.DownloadTask[] = []
  addModalVisible: boolean = false
  saveDir: string = ''
  filterTab: FilterTab = 'downloading'
  private unsubscribes = new Map<string, () => void>()

  constructor() {
    super()
    makeAutoObservable(this, {
      downloads: observable.shallow,
    })
    this.loadStorage()
    if (!this.saveDir) {
      tinker.getPath('downloads').then((defaultDir) => {
        runInAction(() => {
          this.saveDir = defaultDir
        })
        this.restoreDownloads()
      })
    } else {
      this.restoreDownloads()
    }
  }

  private loadStorage() {
    const savedDir = storage.get<string | undefined>(STORAGE_SAVE_DIR)
    if (savedDir) {
      this.saveDir = savedDir
    }
  }

  setSaveDir(dir: string) {
    this.saveDir = dir
    storage.set(STORAGE_SAVE_DIR, dir)
  }

  buildSavePath(fileName: string, dir = this.saveDir): string {
    const sep = contain(dir, '\\') ? '\\' : '/'
    return dir + sep + fileName
  }

  setAddModalVisible(visible: boolean) {
    this.addModalVisible = visible
  }

  setFilterTab(tab: FilterTab) {
    this.filterTab = tab
  }

  get filteredDownloads(): tinker.DownloadTask[] {
    if (this.filterTab === 'completed') {
      return filter(this.downloads, isFinished)
    }
    return filter(this.downloads, (d) => !isFinished(d))
  }

  get hasCompleted(): boolean {
    return this.downloads.some(isFinished)
  }

  private notifyChange() {
    this.downloads = [...this.downloads]
  }

  private async restoreDownloads() {
    try {
      const tasks = await tinker.getDownloads()
      runInAction(() => {
        for (const task of tasks) {
          this.listen(task)
        }
        this.downloads = tasks
      })
    } catch {
      // ignore
    }
  }

  private listen(task: tinker.DownloadTask) {
    const unsub = task.onProgress(() => runInAction(() => this.notifyChange()))
    this.unsubscribes.set(task.id, unsub)
    task
      .then(() => runInAction(() => this.notifyChange()))
      .catch(() => runInAction(() => this.notifyChange()))
      .finally(() => this.unsubscribes.delete(task.id))
  }

  private unlisten(task: tinker.DownloadTask) {
    const unsub = this.unsubscribes.get(task.id)
    if (unsub) {
      unsub()
      this.unsubscribes.delete(task.id)
    }
  }

  startDownload(url: string, savePath: string) {
    const existing = find(
      this.downloads,
      (d) => !isFinished(d) && d.url === url
    )
    if (existing) {
      if (existing.savePath === savePath) {
        return existing
      }
      const message = i18n.t('duplicateDownloadUrl')
      toast.error(message)
      throw new Error(message)
    }

    const task = tinker.download({ url, savePath })
    this.listen(task)
    this.downloads.push(task)
    return task
  }

  togglePause(id: string) {
    const task = find(this.downloads, (d) => d.id === id)
    if (!task || task.state !== 'progressing') return

    if (task.paused) {
      task.resume()
    } else {
      task.pause()
    }
  }

  deleteDownload(id: string) {
    const task = find(this.downloads, (d) => d.id === id)
    if (task) {
      this.unlisten(task)
      task.delete()
    }
    this.downloads = filter(this.downloads, (d) => d.id !== id)
  }

  showInFolder(savePath: string) {
    tinker.showItemInPath(savePath)
  }

  clearCompleted() {
    const kept: tinker.DownloadTask[] = []
    for (const d of this.downloads) {
      if (isFinished(d)) {
        this.unlisten(d)
        d.delete()
      } else {
        kept.push(d)
      }
    }
    this.downloads = kept
  }
}

export default new Store()

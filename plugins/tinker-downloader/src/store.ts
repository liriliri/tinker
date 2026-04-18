import { makeAutoObservable, observable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import contain from 'licia/contain'
import find from 'licia/find'
import filter from 'licia/filter'
import BaseStore from 'share/BaseStore'
import { FilterTab } from './types'

const storage = new LocalStore('tinker-downloader')

function isFinished(d: tinker.DownloadTask): boolean {
  return d.state === 'completed' || d.state === 'cancelled'
}

class Store extends BaseStore {
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
    this.init()
  }

  private async init() {
    const savedDir = storage.get('saveDir')
    if (savedDir) {
      this.saveDir = savedDir as string
    } else {
      const defaultDir = await tinker.getPath('downloads')
      runInAction(() => {
        this.saveDir = defaultDir
      })
    }
    this.restoreDownloads()
  }

  setSaveDir(dir: string) {
    this.saveDir = dir
    storage.set('saveDir', dir)
  }

  buildSavePath(fileName: string): string {
    const sep = contain(this.saveDir, '\\') ? '\\' : '/'
    return this.saveDir + sep + fileName
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
    const task = tinker.download({ url, savePath })
    this.listen(task)
    this.downloads.push(task)
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
